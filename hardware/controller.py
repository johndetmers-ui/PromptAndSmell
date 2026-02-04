"""
Prompt and Smell -- Hardware Controller
-----------------------------------------
Main controller script that reads an OSC JSON formula, maps ingredients to
physical pump channels, calculates pump actuation times, and sends serial
commands to an Arduino or Raspberry Pi to dispense the fragrance.

Usage:
    python controller.py --file scent.json --volume 5 --simulate
    python controller.py --file scent.json --volume 10 --port COM4
    cat scent.json | python controller.py --stdin --volume 5 --simulate

Classes:
    SerialInterface  -- handles serial communication with the controller board
    PumpController   -- maps ingredients to channels and calculates durations
    ScentDispenser   -- orchestrates the full dispensing session
"""

import argparse
import json
import logging
import sys
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

try:
    import serial  # type: ignore[import]
except ImportError:
    serial = None  # Allow import in simulation mode without pyserial

try:
    from rich.console import Console
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
    from rich.panel import Panel
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from config import (
    HardwareConfig,
    load_config,
    DEFAULT_TOTAL_VOLUME_ML,
    MIN_DISPENSE_VOLUME_ML,
    MAX_DISPENSE_VOLUME_ML,
    MIN_PUMP_DURATION_MS,
    MAX_PUMP_DURATION_MS,
    INTER_PUMP_DELAY_MS,
    SERIAL_RECONNECT_DELAY,
    SERIAL_MAX_RECONNECT_ATTEMPTS,
)
from protocol import (
    CommandBuilder,
    CommandSequence,
    ResponseParser,
    Response,
    DEFAULT_TIMEOUT_S,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("controller")

console = Console() if RICH_AVAILABLE else None


# ---------------------------------------------------------------------------
# Data Classes
# ---------------------------------------------------------------------------

@dataclass
class DispenseStep:
    """One step in the dispensing plan."""
    ingredient: str
    channel: int
    percentage: float
    volume_ml: float
    duration_ms: int
    note_type: str = ""
    cas: str = ""


@dataclass
class DispensePlan:
    """Complete dispensing plan derived from an OSC formula."""
    formula_name: str
    total_volume_ml: float
    steps: List[DispenseStep] = field(default_factory=list)
    skipped: List[Dict] = field(default_factory=list)
    estimated_time_ms: int = 0


# ---------------------------------------------------------------------------
# SerialInterface
# ---------------------------------------------------------------------------

class SerialInterface:
    """
    Manages the serial connection to the pump controller board.
    Supports sending commands, receiving responses, and reconnection.
    """

    def __init__(
        self,
        port: str,
        baud_rate: int = 115200,
        timeout: float = 2.0,
        simulate: bool = False,
    ) -> None:
        self.port = port
        self.baud_rate = baud_rate
        self.timeout = timeout
        self.simulate = simulate
        self._connection = None

    def connect(self) -> bool:
        """Open the serial connection. Returns True on success."""
        if self.simulate:
            logger.info("SIMULATE: Serial connection to %s (not actually opened)", self.port)
            return True

        if serial is None:
            raise ImportError(
                "pyserial is required for hardware communication. "
                "Install it with: pip install pyserial"
            )

        for attempt in range(1, SERIAL_MAX_RECONNECT_ATTEMPTS + 1):
            try:
                self._connection = serial.Serial(
                    port=self.port,
                    baudrate=self.baud_rate,
                    timeout=self.timeout,
                    write_timeout=self.timeout,
                )
                # Wait for the controller to initialize after connection
                time.sleep(2.0)
                # Flush any startup messages
                self._connection.reset_input_buffer()
                logger.info("Connected to %s at %d baud", self.port, self.baud_rate)
                return True
            except Exception as exc:
                logger.warning(
                    "Connection attempt %d/%d failed: %s",
                    attempt,
                    SERIAL_MAX_RECONNECT_ATTEMPTS,
                    exc,
                )
                time.sleep(SERIAL_RECONNECT_DELAY)

        logger.error("Failed to connect after %d attempts", SERIAL_MAX_RECONNECT_ATTEMPTS)
        return False

    def disconnect(self) -> None:
        """Close the serial connection."""
        if self.simulate:
            logger.info("SIMULATE: Serial connection closed")
            return
        if self._connection and self._connection.is_open:
            self._connection.close()
            logger.info("Serial connection closed")

    def send(self, command_raw: str, timeout: Optional[float] = None) -> Response:
        """
        Send a raw command string and wait for a response.
        Returns a parsed Response object.
        """
        effective_timeout = timeout or DEFAULT_TIMEOUT_S
        start_time = time.time()

        if self.simulate:
            logger.info("SIMULATE TX: %s", command_raw.strip())
            # Simulate a successful response
            return Response(
                success=True,
                code="OK",
                message="Simulated OK",
                raw="OK (simulated)",
                latency_ms=0.0,
            )

        if not self._connection or not self._connection.is_open:
            return Response(
                success=False,
                code="E08",
                message="Serial port not connected",
                latency_ms=0.0,
            )

        try:
            self._connection.write(command_raw.encode("ascii"))
            self._connection.flush()
            logger.debug("TX: %s", command_raw.strip())

            # Read response with timeout
            self._connection.timeout = effective_timeout
            raw_response = self._connection.readline().decode("ascii", errors="replace")
            logger.debug("RX: %s", raw_response.strip())

            return ResponseParser.parse(raw_response, start_time)

        except Exception as exc:
            elapsed = (time.time() - start_time) * 1000.0
            logger.error("Serial communication error: %s", exc)
            return Response(
                success=False,
                code="E08",
                message=f"Serial error: {exc}",
                latency_ms=elapsed,
            )

    @property
    def is_connected(self) -> bool:
        if self.simulate:
            return True
        return self._connection is not None and self._connection.is_open


# ---------------------------------------------------------------------------
# PumpController
# ---------------------------------------------------------------------------

class PumpController:
    """
    Translates an OSC formula into a dispensing plan by mapping ingredients
    to pump channels and calculating actuation durations.
    """

    def __init__(self, config: HardwareConfig) -> None:
        self.config = config

    def create_plan(
        self,
        formula: Dict,
        total_volume_ml: float = DEFAULT_TOTAL_VOLUME_ML,
    ) -> DispensePlan:
        """
        Create a DispensePlan from an OSC formula dictionary.

        Args:
            formula: Parsed OSC JSON formula.
            total_volume_ml: Desired total output volume in milliliters.

        Returns:
            A DispensePlan with ordered steps and any skipped ingredients.
        """
        plan = DispensePlan(
            formula_name=formula.get("name", "Unnamed"),
            total_volume_ml=total_volume_ml,
        )

        ingredients = formula.get("ingredients", [])
        carrier = formula.get("carrier", {})

        # Combine ingredients and carrier into a single list
        all_items = list(ingredients)
        if carrier:
            all_items.append({
                "name": carrier.get("name", "Ethanol"),
                "percentage": carrier.get("percentage", 0),
                "noteType": "carrier",
                "cas": carrier.get("cas", ""),
                "category": "carrier",
                "role": "Carrier solvent",
            })

        for item in all_items:
            name = item.get("name", "Unknown")
            percentage = float(item.get("percentage", 0))
            note_type = item.get("noteType", "")
            cas = item.get("cas", "")

            if percentage <= 0:
                continue

            # Calculate volume for this ingredient
            volume_ml = (percentage / 100.0) * total_volume_ml

            if volume_ml < MIN_DISPENSE_VOLUME_ML:
                plan.skipped.append({
                    "ingredient": name,
                    "reason": f"Volume too small ({volume_ml:.4f} ml < {MIN_DISPENSE_VOLUME_ML} ml minimum)",
                    "percentage": percentage,
                })
                continue

            # Find the pump channel
            channel = self.config.find_channel_for_ingredient(name)
            if channel is None:
                plan.skipped.append({
                    "ingredient": name,
                    "reason": "No pump channel assigned for this ingredient",
                    "percentage": percentage,
                })
                continue

            ch_config = self.config.channels[channel]

            # Check volume limits
            if volume_ml > ch_config.max_volume_ml:
                plan.skipped.append({
                    "ingredient": name,
                    "reason": (
                        f"Requested volume ({volume_ml:.2f} ml) exceeds channel max "
                        f"({ch_config.max_volume_ml} ml)"
                    ),
                    "percentage": percentage,
                })
                continue

            # Calculate pump duration in milliseconds
            flow_rate = ch_config.effective_flow_rate()  # ml/min
            if flow_rate <= 0:
                plan.skipped.append({
                    "ingredient": name,
                    "reason": "Channel has zero or negative flow rate",
                    "percentage": percentage,
                })
                continue

            duration_ms = int((volume_ml / flow_rate) * 60.0 * 1000.0)

            # Clamp duration
            if duration_ms < MIN_PUMP_DURATION_MS:
                duration_ms = MIN_PUMP_DURATION_MS
            if duration_ms > MAX_PUMP_DURATION_MS:
                logger.warning(
                    "Duration for %s clamped from %d ms to %d ms",
                    name, duration_ms, MAX_PUMP_DURATION_MS,
                )
                duration_ms = MAX_PUMP_DURATION_MS

            plan.steps.append(DispenseStep(
                ingredient=name,
                channel=channel,
                percentage=percentage,
                volume_ml=volume_ml,
                duration_ms=duration_ms,
                note_type=note_type,
                cas=cas,
            ))

        # Sort steps: carrier first (longest run), then by note type order
        note_order = {"carrier": 0, "base": 1, "heart": 2, "top": 3}
        plan.steps.sort(key=lambda s: (note_order.get(s.note_type, 2), -s.duration_ms))

        # Calculate estimated total time
        plan.estimated_time_ms = (
            sum(s.duration_ms for s in plan.steps)
            + INTER_PUMP_DELAY_MS * max(0, len(plan.steps) - 1)
        )

        return plan


# ---------------------------------------------------------------------------
# ScentDispenser
# ---------------------------------------------------------------------------

class ScentDispenser:
    """
    Orchestrates the full dispensing process: loads the formula, builds a
    plan, connects to the hardware, and executes the dispensing sequence.
    """

    def __init__(
        self,
        config: HardwareConfig,
        simulate: bool = False,
    ) -> None:
        self.config = config
        self.simulate = simulate
        self.pump_ctrl = PumpController(config)
        self.serial = SerialInterface(
            port=config.serial_port,
            baud_rate=config.baud_rate,
            timeout=config.serial_timeout,
            simulate=simulate,
        )

    def load_formula(self, source: str = "", from_stdin: bool = False) -> Dict:
        """
        Load an OSC formula from a file path or stdin.

        Args:
            source: File path to the OSC JSON file.
            from_stdin: If True, read from stdin instead of a file.

        Returns:
            Parsed formula dictionary.
        """
        if from_stdin:
            logger.info("Reading formula from stdin...")
            raw = sys.stdin.read()
        else:
            logger.info("Loading formula from: %s", source)
            with open(source, "r", encoding="utf-8") as f:
                raw = f.read()

        formula = json.loads(raw)

        # Basic validation
        if "ingredients" not in formula:
            raise ValueError("Formula JSON must contain an 'ingredients' array")

        return formula

    def display_plan(self, plan: DispensePlan) -> None:
        """Display the dispensing plan in a human-readable format."""
        if RICH_AVAILABLE and console:
            console.print(Panel(
                f"[bold]{plan.formula_name}[/bold]\n"
                f"Total volume: {plan.total_volume_ml} ml\n"
                f"Steps: {len(plan.steps)}\n"
                f"Estimated time: {plan.estimated_time_ms / 1000:.1f} seconds",
                title="Dispensing Plan",
            ))

            table = Table(title="Dispense Steps")
            table.add_column("Order", justify="right", width=5)
            table.add_column("Ingredient", width=30)
            table.add_column("Channel", justify="center", width=8)
            table.add_column("Note", justify="center", width=8)
            table.add_column("%", justify="right", width=8)
            table.add_column("Volume (ml)", justify="right", width=12)
            table.add_column("Duration (ms)", justify="right", width=13)

            for i, step in enumerate(plan.steps, 1):
                table.add_row(
                    str(i),
                    step.ingredient,
                    str(step.channel),
                    step.note_type,
                    f"{step.percentage:.2f}",
                    f"{step.volume_ml:.3f}",
                    str(step.duration_ms),
                )

            console.print(table)

            if plan.skipped:
                skip_table = Table(title="Skipped Ingredients")
                skip_table.add_column("Ingredient", width=30)
                skip_table.add_column("Reason", width=50)
                skip_table.add_column("%", justify="right", width=8)
                for sk in plan.skipped:
                    skip_table.add_row(
                        sk["ingredient"],
                        sk["reason"],
                        f"{sk['percentage']:.2f}",
                    )
                console.print(skip_table)
        else:
            # Plain text fallback
            print(f"\n=== Dispensing Plan: {plan.formula_name} ===")
            print(f"Total volume: {plan.total_volume_ml} ml")
            print(f"Steps: {len(plan.steps)}")
            print(f"Estimated time: {plan.estimated_time_ms / 1000:.1f} seconds\n")

            print(f"{'#':>3}  {'Ingredient':<30}  {'Ch':>3}  {'Note':<7}  "
                  f"{'%':>6}  {'Vol(ml)':>8}  {'Dur(ms)':>8}")
            print("-" * 80)
            for i, step in enumerate(plan.steps, 1):
                print(f"{i:>3}  {step.ingredient:<30}  {step.channel:>3}  "
                      f"{step.note_type:<7}  {step.percentage:>6.2f}  "
                      f"{step.volume_ml:>8.3f}  {step.duration_ms:>8}")

            if plan.skipped:
                print(f"\nSkipped ({len(plan.skipped)}):")
                for sk in plan.skipped:
                    print(f"  - {sk['ingredient']}: {sk['reason']}")

    def execute(self, plan: DispensePlan) -> bool:
        """
        Execute a dispensing plan by sending commands to the controller.

        Returns True if all steps completed successfully.
        """
        if not plan.steps:
            logger.warning("No dispensable steps in plan. Nothing to do.")
            return False

        # Connect to hardware
        if not self.serial.connect():
            logger.error("Could not establish serial connection")
            return False

        success = True

        try:
            # Send START
            resp = self.serial.send(CommandBuilder.start().raw)
            if not resp.success:
                logger.error("START command failed: %s", resp.message)
                return False

            # Execute each step
            use_progress = RICH_AVAILABLE and console and not self.simulate
            if use_progress:
                with Progress(
                    SpinnerColumn(),
                    TextColumn("[progress.description]{task.description}"),
                    BarColumn(),
                    TimeElapsedColumn(),
                    console=console,
                ) as progress:
                    task = progress.add_task("Dispensing...", total=len(plan.steps))
                    for step in plan.steps:
                        progress.update(
                            task,
                            description=f"Pumping {step.ingredient} (ch{step.channel})",
                        )
                        ok = self._execute_step(step)
                        if not ok:
                            success = False
                            break
                        progress.advance(task)
            else:
                for i, step in enumerate(plan.steps, 1):
                    logger.info(
                        "Step %d/%d: %s (ch%d, %d ms)",
                        i, len(plan.steps), step.ingredient,
                        step.channel, step.duration_ms,
                    )
                    ok = self._execute_step(step)
                    if not ok:
                        success = False
                        break

            # Send STOP
            resp = self.serial.send(CommandBuilder.stop().raw)
            if not resp.success:
                logger.warning("STOP command returned: %s", resp.message)

        except KeyboardInterrupt:
            logger.warning("Interrupted by user -- sending emergency STOP")
            self.serial.send(CommandBuilder.stop().raw)
            success = False

        finally:
            self.serial.disconnect()

        return success

    def _execute_step(self, step: DispenseStep) -> bool:
        """Send a single PUMP command and an inter-pump WAIT."""
        cmd = CommandBuilder.pump(step.channel, step.duration_ms)
        resp = self.serial.send(cmd.raw, timeout=step.duration_ms / 1000.0 + 5.0)

        if not resp.success:
            logger.error(
                "PUMP command failed for %s (ch%d): %s",
                step.ingredient, step.channel, resp.message,
            )
            return False

        # Inter-pump delay
        if INTER_PUMP_DELAY_MS > 0:
            wait_cmd = CommandBuilder.wait(INTER_PUMP_DELAY_MS)
            self.serial.send(wait_cmd.raw)

        return True

    def run(
        self,
        formula_source: str = "",
        from_stdin: bool = False,
        total_volume_ml: float = DEFAULT_TOTAL_VOLUME_ML,
    ) -> bool:
        """
        Full pipeline: load formula, build plan, display, execute.

        Returns True if dispensing completed successfully.
        """
        # Load formula
        formula = self.load_formula(source=formula_source, from_stdin=from_stdin)
        logger.info("Formula loaded: %s", formula.get("name", "Unnamed"))

        # Build plan
        plan = self.pump_ctrl.create_plan(formula, total_volume_ml)

        # Display plan
        self.display_plan(plan)

        if not plan.steps:
            logger.error(
                "No ingredients could be mapped to pump channels. "
                "Check your ingredient_map.json configuration."
            )
            return False

        # Confirm unless simulating
        if not self.simulate:
            try:
                answer = input(
                    f"\nProceed with dispensing {plan.total_volume_ml} ml? [y/N] "
                )
                if answer.strip().lower() not in ("y", "yes"):
                    logger.info("Dispensing cancelled by user")
                    return False
            except EOFError:
                pass  # Non-interactive; proceed

        # Execute
        ok = self.execute(plan)

        if ok:
            logger.info("Dispensing completed successfully")
            if RICH_AVAILABLE and console:
                console.print("[bold green]Dispensing complete.[/bold green]")
        else:
            logger.error("Dispensing finished with errors")
            if RICH_AVAILABLE and console:
                console.print("[bold red]Dispensing finished with errors.[/bold red]")

        return ok


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prompt and Smell -- Scent Dispenser Controller",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python controller.py --file scent.json --volume 5 --simulate\n"
            "  python controller.py --file scent.json --volume 10 --port COM4\n"
            "  cat scent.json | python controller.py --stdin --volume 5 --simulate\n"
        ),
    )

    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument(
        "--file", "-f",
        help="Path to the OSC JSON formula file",
    )
    source_group.add_argument(
        "--stdin",
        action="store_true",
        help="Read the OSC JSON formula from standard input",
    )

    parser.add_argument(
        "--volume", "-v",
        type=float,
        default=DEFAULT_TOTAL_VOLUME_ML,
        help=f"Total output volume in milliliters (default: {DEFAULT_TOTAL_VOLUME_ML})",
    )
    parser.add_argument(
        "--port", "-p",
        default=None,
        help="Serial port for the pump controller (e.g., COM3 or /dev/ttyACM0)",
    )
    parser.add_argument(
        "--simulate", "-s",
        action="store_true",
        help="Simulation mode: print actions without sending serial commands",
    )
    parser.add_argument(
        "--config", "-c",
        default=None,
        help="Path to a custom ingredient_map.json file",
    )
    parser.add_argument(
        "--calibration",
        default=None,
        help="Path to a custom calibration.json file",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug-level logging",
    )

    return parser


def main() -> None:
    parser = build_cli()
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Load configuration
    config = load_config(
        serial_port=args.port,
        channel_map_path=args.config,
        calibration_path=args.calibration,
    )

    # Validate volume
    if args.volume < MIN_DISPENSE_VOLUME_ML:
        logger.error("Volume %.2f ml is below minimum (%.2f ml)", args.volume, MIN_DISPENSE_VOLUME_ML)
        sys.exit(1)
    if args.volume > MAX_DISPENSE_VOLUME_ML:
        logger.error("Volume %.2f ml exceeds maximum (%.2f ml)", args.volume, MAX_DISPENSE_VOLUME_ML)
        sys.exit(1)

    # Create dispenser and run
    dispenser = ScentDispenser(config=config, simulate=args.simulate)

    try:
        ok = dispenser.run(
            formula_source=args.file or "",
            from_stdin=args.stdin,
            total_volume_ml=args.volume,
        )
        sys.exit(0 if ok else 1)

    except FileNotFoundError as exc:
        logger.error("File not found: %s", exc)
        sys.exit(1)
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON in formula file: %s", exc)
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(130)
    except Exception as exc:
        logger.error("Unexpected error: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
