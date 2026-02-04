"""
Prompt and Smell -- Pump Calibration Script
----------------------------------------------
Interactive CLI tool that guides the user through calibrating each pump
channel. Measures actual flow rate versus commanded flow rate and saves
calibration data to calibration.json.

Usage:
    python calibration.py                        # Calibrate all channels
    python calibration.py --channel 3            # Calibrate channel 3 only
    python calibration.py --channel 3 --port COM4
    python calibration.py --view                 # View current calibration data

The calibration process for each channel:
    1. Place a graduated container under the pump outlet.
    2. The script commands the pump to run for a fixed duration.
    3. The user measures the actual volume dispensed.
    4. The script calculates the calibration factor and saves it.
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.prompt import Prompt, FloatPrompt, Confirm
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from config import (
    HardwareConfig,
    load_config,
    CALIBRATION_DATA_PATH,
    NUM_CHANNELS,
)
from protocol import CommandBuilder, ResponseParser

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("calibration")

console = Console() if RICH_AVAILABLE else None

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CALIBRATION_PUMP_DURATION_MS = 30000  # 30 seconds per calibration run
CALIBRATION_SETTLE_TIME_S = 2.0       # Wait after pumping for drips


# ---------------------------------------------------------------------------
# Calibration Data Management
# ---------------------------------------------------------------------------

def load_existing_calibration(path: str = CALIBRATION_DATA_PATH) -> Dict:
    """Load existing calibration data or return an empty structure."""
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "created": datetime.now(timezone.utc).isoformat(),
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "channels": [],
    }


def save_calibration(data: Dict, path: str = CALIBRATION_DATA_PATH) -> None:
    """Save calibration data to disk."""
    data["last_updated"] = datetime.now(timezone.utc).isoformat()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    logger.info("Calibration data saved to %s", path)


def update_channel_calibration(
    cal_data: Dict,
    channel: int,
    factor: float,
    expected_ml: float,
    actual_ml: float,
    duration_ms: int,
    ingredient: str,
) -> None:
    """Update or add calibration data for a single channel."""
    entry = {
        "channel": channel,
        "ingredient": ingredient,
        "calibration_factor": round(factor, 6),
        "expected_volume_ml": round(expected_ml, 4),
        "actual_volume_ml": round(actual_ml, 4),
        "duration_ms": duration_ms,
        "calibrated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Replace existing entry for this channel or append
    channels = cal_data.get("channels", [])
    replaced = False
    for i, ch in enumerate(channels):
        if ch.get("channel") == channel:
            channels[i] = entry
            replaced = True
            break
    if not replaced:
        channels.append(entry)

    cal_data["channels"] = channels


# ---------------------------------------------------------------------------
# Serial Helpers
# ---------------------------------------------------------------------------

class CalibrationSerial:
    """
    Minimal serial interface for calibration purposes.
    Supports both real and simulated modes.
    """

    def __init__(self, port: str, baud_rate: int = 115200, simulate: bool = False):
        self.port = port
        self.baud_rate = baud_rate
        self.simulate = simulate
        self._conn = None

    def connect(self) -> bool:
        if self.simulate:
            logger.info("SIMULATE: Connected to %s", self.port)
            return True

        try:
            import serial  # type: ignore[import]
        except ImportError:
            logger.error("pyserial is not installed. Use --simulate for testing.")
            return False

        try:
            self._conn = serial.Serial(
                port=self.port,
                baudrate=self.baud_rate,
                timeout=2.0,
                write_timeout=2.0,
            )
            time.sleep(2.0)
            self._conn.reset_input_buffer()
            logger.info("Connected to %s", self.port)
            return True
        except Exception as exc:
            logger.error("Connection failed: %s", exc)
            return False

    def disconnect(self) -> None:
        if self._conn and self._conn.is_open:
            self._conn.close()
        logger.info("Disconnected")

    def send(self, raw_cmd: str) -> bool:
        if self.simulate:
            logger.info("SIMULATE TX: %s", raw_cmd.strip())
            return True

        if not self._conn or not self._conn.is_open:
            logger.error("Not connected")
            return False

        try:
            self._conn.write(raw_cmd.encode("ascii"))
            self._conn.flush()
            response = self._conn.readline().decode("ascii", errors="replace")
            parsed = ResponseParser.parse(response)
            if not parsed.success:
                logger.error("Command failed: %s", parsed.message)
                return False
            return True
        except Exception as exc:
            logger.error("Serial error: %s", exc)
            return False


# ---------------------------------------------------------------------------
# Calibration Logic
# ---------------------------------------------------------------------------

def prompt_float(message: str, default: Optional[float] = None) -> float:
    """Prompt the user for a floating-point number."""
    if RICH_AVAILABLE:
        default_str = str(default) if default is not None else ""
        val = FloatPrompt.ask(message, default=default)
        return val
    else:
        suffix = f" [{default}]" if default is not None else ""
        while True:
            raw = input(f"{message}{suffix}: ").strip()
            if not raw and default is not None:
                return default
            try:
                return float(raw)
            except ValueError:
                print("Please enter a valid number.")


def prompt_confirm(message: str, default: bool = True) -> bool:
    """Prompt the user for yes/no confirmation."""
    if RICH_AVAILABLE:
        return Confirm.ask(message, default=default)
    else:
        suffix = " [Y/n]" if default else " [y/N]"
        raw = input(f"{message}{suffix}: ").strip().lower()
        if not raw:
            return default
        return raw in ("y", "yes")


def calibrate_channel(
    channel: int,
    config: HardwareConfig,
    serial_iface: CalibrationSerial,
    duration_ms: int = CALIBRATION_PUMP_DURATION_MS,
) -> Optional[Dict]:
    """
    Calibrate a single pump channel.

    Returns a dict with calibration results or None if skipped/cancelled.
    """
    ch_config = config.channels.get(channel)
    if ch_config is None:
        logger.warning("Channel %d is not configured. Skipping.", channel)
        return None

    ingredient = ch_config.ingredient
    nominal_flow_rate = ch_config.flow_rate_ml_per_min

    # Calculate expected volume for the calibration duration
    duration_min = duration_ms / 60000.0
    expected_ml = nominal_flow_rate * duration_min

    print(f"\n--- Calibrating Channel {channel}: {ingredient} ---")
    print(f"Nominal flow rate: {nominal_flow_rate} ml/min")
    print(f"Pump will run for {duration_ms / 1000:.1f} seconds")
    print(f"Expected volume: {expected_ml:.2f} ml")
    print()

    if not prompt_confirm("Place a graduated container under the outlet. Ready?"):
        print("Skipped.")
        return None

    # Send START
    if not serial_iface.send(CommandBuilder.start().raw):
        logger.error("Failed to send START")
        return None

    # Run the pump
    print(f"Pumping for {duration_ms / 1000:.1f} seconds...")

    if not serial_iface.send(CommandBuilder.pump(channel, duration_ms).raw):
        logger.error("Failed to send PUMP command")
        serial_iface.send(CommandBuilder.stop().raw)
        return None

    # If simulating, no need to wait; otherwise wait for pump to finish
    if not serial_iface.simulate:
        time.sleep(duration_ms / 1000.0 + CALIBRATION_SETTLE_TIME_S)
    else:
        print(f"(Simulated {duration_ms / 1000:.1f}s pump run)")

    # Send STOP
    serial_iface.send(CommandBuilder.stop().raw)

    # Get measured volume from user
    print()
    actual_ml = prompt_float(
        "Enter the measured volume in ml",
        default=expected_ml,
    )

    if actual_ml <= 0:
        print("Invalid volume. Skipping this channel.")
        return None

    # Calculate calibration factor
    # factor > 1 means pump delivers less than expected (need to run longer)
    # factor < 1 means pump delivers more than expected (need to run shorter)
    calibration_factor = expected_ml / actual_ml

    print(f"\nResults for channel {channel} ({ingredient}):")
    print(f"  Expected: {expected_ml:.3f} ml")
    print(f"  Actual:   {actual_ml:.3f} ml")
    print(f"  Factor:   {calibration_factor:.4f}")

    if calibration_factor > 2.0 or calibration_factor < 0.2:
        print("WARNING: Calibration factor is far from 1.0. This may indicate a hardware problem.")
        if not prompt_confirm("Accept this calibration anyway?", default=False):
            return None

    return {
        "channel": channel,
        "ingredient": ingredient,
        "calibration_factor": calibration_factor,
        "expected_ml": expected_ml,
        "actual_ml": actual_ml,
        "duration_ms": duration_ms,
    }


def display_calibration(cal_data: Dict) -> None:
    """Display current calibration data."""
    channels = cal_data.get("channels", [])

    if not channels:
        print("No calibration data found.")
        return

    if RICH_AVAILABLE and console:
        console.print(Panel(
            f"Created: {cal_data.get('created', 'N/A')}\n"
            f"Last updated: {cal_data.get('last_updated', 'N/A')}\n"
            f"Channels calibrated: {len(channels)}",
            title="Calibration Data",
        ))

        table = Table(title="Channel Calibration Factors")
        table.add_column("Channel", justify="center", width=8)
        table.add_column("Ingredient", width=30)
        table.add_column("Factor", justify="right", width=10)
        table.add_column("Expected (ml)", justify="right", width=14)
        table.add_column("Actual (ml)", justify="right", width=12)
        table.add_column("Calibrated At", width=22)

        for ch in sorted(channels, key=lambda c: c.get("channel", 0)):
            factor = ch.get("calibration_factor", 1.0)
            style = ""
            if factor > 1.3 or factor < 0.7:
                style = "bold yellow"
            if factor > 2.0 or factor < 0.3:
                style = "bold red"

            table.add_row(
                str(ch.get("channel", "?")),
                ch.get("ingredient", "?"),
                f"{factor:.4f}",
                f"{ch.get('expected_volume_ml', 0):.3f}",
                f"{ch.get('actual_volume_ml', 0):.3f}",
                ch.get("calibrated_at", "N/A")[:19],
                style=style,
            )

        console.print(table)
    else:
        print(f"\n=== Calibration Data ===")
        print(f"Created: {cal_data.get('created', 'N/A')}")
        print(f"Last updated: {cal_data.get('last_updated', 'N/A')}")
        print(f"Channels: {len(channels)}\n")

        print(f"{'Ch':>3}  {'Ingredient':<30}  {'Factor':>8}  {'Expected':>10}  "
              f"{'Actual':>8}  {'Date':>19}")
        print("-" * 90)
        for ch in sorted(channels, key=lambda c: c.get("channel", 0)):
            print(
                f"{ch.get('channel', '?'):>3}  "
                f"{ch.get('ingredient', '?'):<30}  "
                f"{ch.get('calibration_factor', 1.0):>8.4f}  "
                f"{ch.get('expected_volume_ml', 0):>10.3f}  "
                f"{ch.get('actual_volume_ml', 0):>8.3f}  "
                f"{ch.get('calibrated_at', 'N/A')[:19]:>19}"
            )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prompt and Smell -- Pump Calibration Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python calibration.py                          # Calibrate all channels\n"
            "  python calibration.py --channel 3              # Calibrate channel 3 only\n"
            "  python calibration.py --channel 3 --simulate   # Simulate calibration\n"
            "  python calibration.py --view                   # View calibration data\n"
        ),
    )

    parser.add_argument(
        "--channel",
        type=int,
        default=None,
        help="Calibrate only this channel number (0-15)",
    )
    parser.add_argument(
        "--port", "-p",
        default=None,
        help="Serial port for the pump controller",
    )
    parser.add_argument(
        "--simulate", "-s",
        action="store_true",
        help="Simulation mode (no actual hardware)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=CALIBRATION_PUMP_DURATION_MS,
        help=f"Pump run duration in ms for each calibration (default: {CALIBRATION_PUMP_DURATION_MS})",
    )
    parser.add_argument(
        "--view",
        action="store_true",
        help="View current calibration data and exit",
    )
    parser.add_argument(
        "--output", "-o",
        default=CALIBRATION_DATA_PATH,
        help=f"Output path for calibration JSON (default: {CALIBRATION_DATA_PATH})",
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Path to a custom ingredient_map.json file",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging",
    )

    return parser


def main() -> None:
    parser = build_cli()
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # View mode
    if args.view:
        cal_data = load_existing_calibration(args.output)
        display_calibration(cal_data)
        return

    # Load configuration
    config = load_config(
        serial_port=args.port,
        channel_map_path=args.config,
    )

    # Validate channel argument
    if args.channel is not None:
        if args.channel < 0 or args.channel >= NUM_CHANNELS:
            logger.error("Channel must be between 0 and %d", NUM_CHANNELS - 1)
            sys.exit(1)
        if args.channel not in config.channels:
            logger.error("Channel %d is not configured in the channel map", args.channel)
            sys.exit(1)
        channels_to_calibrate = [args.channel]
    else:
        channels_to_calibrate = sorted(config.channels.keys())

    if not channels_to_calibrate:
        logger.error("No channels to calibrate")
        sys.exit(1)

    # Display plan
    print(f"\nChannels to calibrate: {len(channels_to_calibrate)}")
    for ch_num in channels_to_calibrate:
        ch = config.channels[ch_num]
        print(f"  Channel {ch_num}: {ch.ingredient}")
    print()

    if not prompt_confirm("Begin calibration?"):
        print("Cancelled.")
        return

    # Connect
    serial_iface = CalibrationSerial(
        port=config.serial_port,
        baud_rate=config.baud_rate,
        simulate=args.simulate,
    )

    if not serial_iface.connect():
        logger.error("Cannot connect to controller")
        sys.exit(1)

    # Load existing calibration data to merge
    cal_data = load_existing_calibration(args.output)

    # Calibrate each channel
    results: List[Dict] = []

    try:
        for ch_num in channels_to_calibrate:
            result = calibrate_channel(
                channel=ch_num,
                config=config,
                serial_iface=serial_iface,
                duration_ms=args.duration,
            )

            if result:
                results.append(result)
                update_channel_calibration(
                    cal_data,
                    channel=result["channel"],
                    factor=result["calibration_factor"],
                    expected_ml=result["expected_ml"],
                    actual_ml=result["actual_ml"],
                    duration_ms=result["duration_ms"],
                    ingredient=result["ingredient"],
                )
                # Save after each successful calibration
                save_calibration(cal_data, args.output)

    except KeyboardInterrupt:
        print("\nCalibration interrupted by user.")

    finally:
        serial_iface.disconnect()

    # Summary
    print(f"\n=== Calibration Summary ===")
    print(f"Channels attempted: {len(channels_to_calibrate)}")
    print(f"Channels calibrated: {len(results)}")
    print(f"Data saved to: {args.output}")

    if results:
        display_calibration(cal_data)


if __name__ == "__main__":
    main()
