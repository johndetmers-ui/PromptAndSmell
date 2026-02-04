"""
Prompt and Smell -- BLE Controller
------------------------------------
Python BLE client for controlling the portable scent device from a
computer or Raspberry Pi. Uses the bleak library for cross-platform
Bluetooth Low Energy communication.

Usage:
    python ble_controller.py scan
    python ble_controller.py connect PS-Portable
    python ble_controller.py blend --file scent.json --duration 30
    python ble_controller.py status
    python ble_controller.py stop
"""

import asyncio
import json
import sys
from typing import Optional, List, Dict, Any

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.text import Text

try:
    from bleak import BleakClient, BleakScanner
    from bleak.backends.device import BLEDevice
    from bleak.backends.scanner import AdvertisementData
    BLEAK_AVAILABLE = True
except ImportError:
    BLEAK_AVAILABLE = False

from config import (
    BLE_SERVICE_UUID,
    BLE_CHAR_SCENT_CMD_UUID,
    BLE_CHAR_STATUS_UUID,
    BLE_CHAR_DEVICE_INFO_UUID,
    BLE_DEVICE_NAME_PREFIX,
    DEFAULT_BLEND_DURATION_S,
)
from accord_mapper import AccordMapper

console = Console()

# ---------------------------------------------------------------------------
# BLE Device Scanner
# ---------------------------------------------------------------------------

async def scan_for_devices(timeout: float = 10.0) -> List[BLEDevice]:
    """
    Scan for nearby Prompt & Smell BLE devices.

    Returns a list of BLEDevice objects whose name starts with the
    expected device name prefix.
    """
    console.print(f"[cyan]Scanning for {BLE_DEVICE_NAME_PREFIX} devices ({timeout}s)...[/cyan]")

    found_devices: List[BLEDevice] = []

    def detection_callback(device: BLEDevice, adv_data: AdvertisementData) -> None:
        if device.name and device.name.startswith(BLE_DEVICE_NAME_PREFIX):
            if device not in found_devices:
                found_devices.append(device)
                console.print(
                    f"  Found: [green]{device.name}[/green] "
                    f"([dim]{device.address}[/dim]) "
                    f"RSSI: {adv_data.rssi} dBm"
                )

    scanner = BleakScanner(detection_callback=detection_callback)
    await scanner.start()
    await asyncio.sleep(timeout)
    await scanner.stop()

    return found_devices


# ---------------------------------------------------------------------------
# BLE Device Client
# ---------------------------------------------------------------------------

class PortableScentClient:
    """
    BLE client for the Prompt & Smell portable scent device.
    Handles connection, command sending, status reading, and notifications.
    """

    def __init__(self, address_or_name: str) -> None:
        self.address_or_name = address_or_name
        self.client: Optional[BleakClient] = None
        self.device: Optional[BLEDevice] = None
        self.connected = False
        self.device_info: Dict[str, Any] = {}
        self._notification_callback = None

    async def find_device(self, timeout: float = 10.0) -> Optional[BLEDevice]:
        """Find the device by name or address."""
        devices = await scan_for_devices(timeout)

        for d in devices:
            if (d.address.lower() == self.address_or_name.lower() or
                (d.name and d.name.lower() == self.address_or_name.lower())):
                return d

        # If exact match not found, try prefix match
        for d in devices:
            if d.name and self.address_or_name.lower() in d.name.lower():
                return d

        return None

    async def connect(self, timeout: float = 15.0) -> bool:
        """
        Connect to the device via BLE.

        Returns True on successful connection.
        """
        console.print(f"[cyan]Searching for device: {self.address_or_name}[/cyan]")

        self.device = await self.find_device(timeout)
        if self.device is None:
            console.print(f"[red]Device '{self.address_or_name}' not found[/red]")
            return False

        console.print(f"[cyan]Connecting to {self.device.name} ({self.device.address})...[/cyan]")

        self.client = BleakClient(
            self.device,
            disconnected_callback=self._on_disconnect,
        )

        try:
            await self.client.connect(timeout=timeout)
            self.connected = True
            console.print(f"[green]Connected to {self.device.name}[/green]")

            # Read device info
            await self._read_device_info()

            # Subscribe to status notifications
            await self._subscribe_status()

            return True

        except Exception as exc:
            console.print(f"[red]Connection failed: {exc}[/red]")
            self.connected = False
            return False

    async def disconnect(self) -> None:
        """Disconnect from the device."""
        if self.client and self.connected:
            await self.client.disconnect()
        self.connected = False
        console.print("[dim]Disconnected[/dim]")

    def _on_disconnect(self, client: BleakClient) -> None:
        """Callback when the device disconnects."""
        self.connected = False
        console.print("[yellow]Device disconnected[/yellow]")

    async def _read_device_info(self) -> None:
        """Read the device info characteristic."""
        try:
            data = await self.client.read_gatt_char(BLE_CHAR_DEVICE_INFO_UUID)
            self.device_info = json.loads(data.decode("utf-8"))
            console.print(Panel(
                f"[cyan]Device:[/cyan] {self.device_info.get('device', 'Unknown')}\n"
                f"[cyan]Firmware:[/cyan] {self.device_info.get('firmware', 'Unknown')}\n"
                f"[cyan]Channels:[/cyan] {self.device_info.get('channels', 0)}\n"
                f"[cyan]Accords:[/cyan] {', '.join(self.device_info.get('accords', []))}",
                title="Device Info",
                border_style="blue",
            ))
        except Exception as exc:
            console.print(f"[yellow]Could not read device info: {exc}[/yellow]")

    async def _subscribe_status(self) -> None:
        """Subscribe to status notifications."""
        try:
            await self.client.start_notify(
                BLE_CHAR_STATUS_UUID,
                self._status_notification_handler,
            )
        except Exception as exc:
            console.print(f"[yellow]Could not subscribe to status: {exc}[/yellow]")

    def _status_notification_handler(self, sender: int, data: bytearray) -> None:
        """Handle incoming status notifications."""
        try:
            status = json.loads(data.decode("utf-8"))
            if self._notification_callback:
                self._notification_callback(status)
        except json.JSONDecodeError:
            pass

    async def send_blend(self, command_bytes: bytes) -> bool:
        """
        Send a blend command to the device.

        Args:
            command_bytes: UTF-8 encoded JSON command from AccordMapper.

        Returns:
            True if the command was sent successfully.
        """
        if not self.connected or not self.client:
            console.print("[red]Not connected to device[/red]")
            return False

        try:
            await self.client.write_gatt_char(
                BLE_CHAR_SCENT_CMD_UUID,
                command_bytes,
                response=False,
            )
            console.print("[green]Blend command sent[/green]")
            return True

        except Exception as exc:
            console.print(f"[red]Failed to send command: {exc}[/red]")
            return False

    async def send_stop(self) -> bool:
        """Send a stop command (all accords at intensity 0)."""
        stop_cmd = json.dumps({
            "accords": [
                {"id": i, "intensity": 0, "duration_ms": 0}
                for i in range(6)
            ]
        }).encode("utf-8")

        return await self.send_blend(stop_cmd)

    async def read_status(self) -> Optional[Dict[str, Any]]:
        """
        Read the current device status.

        Returns:
            Status dictionary or None on failure.
        """
        if not self.connected or not self.client:
            console.print("[red]Not connected to device[/red]")
            return None

        try:
            data = await self.client.read_gatt_char(BLE_CHAR_STATUS_UUID)
            status = json.loads(data.decode("utf-8"))
            return status

        except Exception as exc:
            console.print(f"[red]Failed to read status: {exc}[/red]")
            return None


# ---------------------------------------------------------------------------
# Display Helpers
# ---------------------------------------------------------------------------

def display_status(status: Dict[str, Any]) -> None:
    """Pretty-print device status."""
    battery_pct = status.get("battery_pct", 0)
    battery_v = status.get("battery_v", "?.??")
    state = status.get("state", "unknown")
    fan = status.get("fan_active", False)
    wifi = status.get("wifi_connected", False)
    ip_addr = status.get("ip", "N/A")

    # Battery color
    if battery_pct > 50:
        batt_color = "green"
    elif battery_pct > 20:
        batt_color = "yellow"
    else:
        batt_color = "red"

    # State color
    state_colors = {
        "idle": "blue",
        "connected": "green",
        "diffusing": "magenta",
        "low_battery": "red",
        "shutting_down": "red",
    }
    state_color = state_colors.get(state, "white")

    lines = [
        f"[{batt_color}]Battery: {battery_pct}% ({battery_v}V)[/{batt_color}]",
        f"[{state_color}]State: {state}[/{state_color}]",
        f"Fan: {'[green]ON[/green]' if fan else '[dim]OFF[/dim]'}",
        f"WiFi: {'[green]Connected[/green] (' + ip_addr + ')' if wifi else '[dim]Disconnected[/dim]'}",
    ]

    active = status.get("active_accords", [])
    if active:
        accord_names = ["Floral", "Woody", "Fresh", "Warm", "Sweet", "Clean"]
        lines.append("")
        lines.append("[bold]Active Accords:[/bold]")
        for a in active:
            aid = a.get("id", 0)
            name = accord_names[aid] if aid < len(accord_names) else f"Ch{aid}"
            intensity = a.get("intensity", 0)
            remaining = a.get("remaining_ms", 0) / 1000.0
            lines.append(f"  {name}: intensity {intensity}, {remaining:.1f}s remaining")

    console.print(Panel(
        "\n".join(lines),
        title="Device Status",
        border_style="bright_cyan",
    ))


# ---------------------------------------------------------------------------
# Interactive Mode
# ---------------------------------------------------------------------------

async def interactive_mode(client: PortableScentClient) -> None:
    """Enter interactive command mode after connecting."""
    console.print("\n[bold]Interactive Mode[/bold]")
    console.print("Commands: status, blend <file> [duration], stop, info, quit")
    console.print()

    mapper = AccordMapper()

    while client.connected:
        try:
            cmd_input = await asyncio.get_event_loop().run_in_executor(
                None, lambda: input("ps> ").strip()
            )
        except (EOFError, KeyboardInterrupt):
            break

        if not cmd_input:
            continue

        parts = cmd_input.split()
        cmd = parts[0].lower()

        if cmd == "quit" or cmd == "exit" or cmd == "q":
            break

        elif cmd == "status" or cmd == "s":
            status = await client.read_status()
            if status:
                display_status(status)

        elif cmd == "stop":
            await client.send_stop()
            console.print("[green]Stop command sent[/green]")

        elif cmd == "info" or cmd == "i":
            console.print_json(json.dumps(client.device_info, indent=2))

        elif cmd == "blend" or cmd == "b":
            if len(parts) < 2:
                console.print("[yellow]Usage: blend <file.json> [duration_seconds][/yellow]")
                continue

            file_path = parts[1]
            duration = int(parts[2]) if len(parts) > 2 else DEFAULT_BLEND_DURATION_S

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    formula = json.load(f)

                blend = mapper.map_formula(formula)

                # Display the blend
                from accord_mapper import display_blend
                display_blend(blend)

                # Send to device
                cmd_bytes = mapper.generate_ble_command(blend, duration)
                await client.send_blend(cmd_bytes)

            except FileNotFoundError:
                console.print(f"[red]File not found: {file_path}[/red]")
            except json.JSONDecodeError as exc:
                console.print(f"[red]Invalid JSON: {exc}[/red]")
            except Exception as exc:
                console.print(f"[red]Error: {exc}[/red]")

        elif cmd == "help" or cmd == "h" or cmd == "?":
            console.print("Commands:")
            console.print("  status (s)              - Read device status")
            console.print("  blend (b) <file> [dur]  - Send blend from OSC file")
            console.print("  stop                    - Stop all atomizers")
            console.print("  info (i)                - Show device info")
            console.print("  quit (q)                - Disconnect and exit")

        else:
            console.print(f"[yellow]Unknown command: {cmd}. Type 'help' for commands.[/yellow]")

    await client.disconnect()


# ---------------------------------------------------------------------------
# CLI Commands
# ---------------------------------------------------------------------------

@click.group()
def cli() -> None:
    """Prompt & Smell -- Portable Device BLE Controller"""
    if not BLEAK_AVAILABLE:
        console.print(
            "[red]The 'bleak' library is required but not installed.[/red]\n"
            "Install it with: pip install bleak"
        )
        sys.exit(1)


@cli.command()
@click.option("--timeout", "-t", default=10.0, help="Scan timeout in seconds")
def scan(timeout: float) -> None:
    """Scan for nearby Prompt & Smell BLE devices."""
    async def _scan() -> None:
        devices = await scan_for_devices(timeout)
        if not devices:
            console.print("[yellow]No Prompt & Smell devices found[/yellow]")
            console.print("[dim]Make sure the device is powered on and nearby[/dim]")
        else:
            console.print(f"\n[green]Found {len(devices)} device(s)[/green]")

            table = Table(title="Discovered Devices")
            table.add_column("Name", width=20)
            table.add_column("Address", width=20)
            for d in devices:
                table.add_row(d.name or "Unknown", d.address)
            console.print(table)

    asyncio.run(_scan())


@cli.command()
@click.argument("device_name")
@click.option("--timeout", "-t", default=15.0, help="Connection timeout in seconds")
def connect(device_name: str, timeout: float) -> None:
    """Connect to a device and enter interactive mode."""
    async def _connect() -> None:
        client = PortableScentClient(device_name)
        if await client.connect(timeout):
            await interactive_mode(client)
        else:
            console.print("[red]Could not connect to device[/red]")

    asyncio.run(_connect())


@cli.command()
@click.option("--file", "-f", required=True, type=click.Path(exists=True),
              help="Path to OSC JSON formula file")
@click.option("--duration", "-d", default=DEFAULT_BLEND_DURATION_S, type=int,
              help="Blend duration in seconds")
@click.option("--device", "-D", default=BLE_DEVICE_NAME_PREFIX,
              help="Device name or address")
def blend(file: str, duration: int, device: str) -> None:
    """Send a blend command from an OSC formula file."""
    async def _blend() -> None:
        # Load and map the formula
        with open(file, "r", encoding="utf-8") as f:
            formula = json.load(f)

        mapper = AccordMapper()
        blend_result = mapper.map_formula(formula)

        from accord_mapper import display_blend
        display_blend(blend_result)

        # Connect and send
        client = PortableScentClient(device)
        if not await client.connect():
            console.print("[red]Could not connect to device[/red]")
            return

        cmd_bytes = mapper.generate_ble_command(blend_result, duration)
        await client.send_blend(cmd_bytes)

        console.print(f"[green]Diffusing for {duration} seconds...[/green]")

        # Wait for the duration, then disconnect
        await asyncio.sleep(duration + 5)  # Extra 5s for fan clearing
        await client.disconnect()

    asyncio.run(_blend())


@cli.command()
@click.option("--device", "-D", default=BLE_DEVICE_NAME_PREFIX,
              help="Device name or address")
def status(device: str) -> None:
    """Read the current device status."""
    async def _status() -> None:
        client = PortableScentClient(device)
        if not await client.connect():
            console.print("[red]Could not connect to device[/red]")
            return

        status_data = await client.read_status()
        if status_data:
            display_status(status_data)

        await client.disconnect()

    asyncio.run(_status())


@cli.command()
@click.option("--device", "-D", default=BLE_DEVICE_NAME_PREFIX,
              help="Device name or address")
def stop(device: str) -> None:
    """Stop all atomizers on the device."""
    async def _stop() -> None:
        client = PortableScentClient(device)
        if not await client.connect():
            console.print("[red]Could not connect to device[/red]")
            return

        await client.send_stop()
        console.print("[green]All atomizers stopped[/green]")

        await client.disconnect()

    asyncio.run(_stop())


if __name__ == "__main__":
    cli()
