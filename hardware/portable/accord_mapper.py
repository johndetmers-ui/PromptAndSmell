"""
Prompt and Smell -- Accord Mapper
----------------------------------
Maps a full 16-ingredient OSC formula to 6 accord channels for the
portable scent device. The 6 pre-blended accord cartridges (Floral,
Woody, Fresh, Warm, Sweet, Clean) represent broad scent families.
This module sums ingredient percentages by category, assigns them
to the matching accord channel, and normalizes intensities.

Usage:
    python accord_mapper.py --file scent.json
    python accord_mapper.py --file scent.json --duration 30
    python accord_mapper.py --file scent.json --format ble
    python accord_mapper.py --file scent.json --format http
"""

import json
import struct
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Any

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from pydantic import BaseModel, validator

from config import (
    ACCORD_DEFINITIONS,
    CATEGORY_TO_ACCORD,
    CATEGORY_FALLBACKS,
    get_accord_for_category,
    DEFAULT_BLEND_DURATION_S,
    MAX_INTENSITY,
    BLE_CHAR_SCENT_CMD_UUID,
    AccordDefinition,
)

console = Console()

# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------

class AccordChannel(BaseModel):
    """A single accord channel with its computed intensity."""
    id: int
    name: str
    color_hex: str
    raw_percentage: float = 0.0
    intensity: int = 0  # 0-100, normalized
    contributing_ingredients: List[str] = []

    class Config:
        arbitrary_types_allowed = True


class AccordBlend(BaseModel):
    """Complete 6-channel accord blend derived from an OSC formula."""
    formula_name: str = "Unnamed"
    accords: List[AccordChannel] = []
    total_ingredient_percentage: float = 0.0
    dominant_accord: str = ""

    class Config:
        arbitrary_types_allowed = True


# ---------------------------------------------------------------------------
# AccordMapper
# ---------------------------------------------------------------------------

class AccordMapper:
    """
    Maps a full OSC formula (with up to 20 ingredient categories)
    to 6 accord channels for the portable scent device.

    The mapping works as follows:
    1. For each ingredient, look up its category and find the accord channel.
    2. Sum the percentages for each accord channel.
    3. Normalize so the dominant accord = 100 and others scale proportionally.
    """

    def __init__(self) -> None:
        self.accord_defs = ACCORD_DEFINITIONS

    def map_formula(self, osc_formula: Dict[str, Any]) -> AccordBlend:
        """
        Map an OSC formula dictionary to a 6-channel AccordBlend.

        The formula can use either the 'ingredients' key (from the legacy
        app-side OSCFormula type) or the 'formula' key (from the OSC v1.0
        schema). Both are supported.

        Args:
            osc_formula: Parsed OSC JSON formula dictionary.

        Returns:
            AccordBlend with normalized intensities for each channel.
        """
        # Support both schema formats
        ingredients = osc_formula.get("ingredients", [])
        if not ingredients:
            ingredients = osc_formula.get("formula", [])

        formula_name = (
            osc_formula.get("name", "")
            or osc_formula.get("metadata", {}).get("name", "")
            or "Unnamed"
        )

        # Initialize accumulators for each accord channel
        channel_percentages: Dict[int, float] = {i: 0.0 for i in range(6)}
        channel_ingredients: Dict[int, List[str]] = {i: [] for i in range(6)}
        total_pct = 0.0

        for ingredient in ingredients:
            # Extract category -- support both key naming conventions
            category = (
                ingredient.get("category", "")
                or ingredient.get("cat", "")
            ).lower().strip()

            # Extract percentage
            pct = float(ingredient.get("percentage", 0))
            if pct <= 0:
                continue

            # Extract ingredient name
            name = ingredient.get("name", ingredient.get("ingredient", "Unknown"))

            # Skip carrier solvents (ethanol, DPG, IPM) -- they are not accords
            if category in ("carrier", "solvent"):
                continue

            # Find the matching accord channel
            accord_id = get_accord_for_category(category)

            channel_percentages[accord_id] += pct
            channel_ingredients[accord_id].append(name)
            total_pct += pct

        # Build accord channels with raw percentages
        accords: List[AccordChannel] = []
        max_pct = max(channel_percentages.values()) if channel_percentages else 1.0
        if max_pct <= 0:
            max_pct = 1.0  # Prevent division by zero

        dominant_name = ""

        for accord_def in self.accord_defs:
            raw_pct = channel_percentages.get(accord_def.id, 0.0)
            # Normalize: dominant accord = 100, others proportional
            normalized = int(round((raw_pct / max_pct) * MAX_INTENSITY)) if max_pct > 0 else 0

            if raw_pct == max_pct and raw_pct > 0:
                dominant_name = accord_def.name

            accords.append(AccordChannel(
                id=accord_def.id,
                name=accord_def.name,
                color_hex=accord_def.color_hex,
                raw_percentage=round(raw_pct, 2),
                intensity=normalized,
                contributing_ingredients=channel_ingredients.get(accord_def.id, []),
            ))

        return AccordBlend(
            formula_name=formula_name,
            accords=accords,
            total_ingredient_percentage=round(total_pct, 2),
            dominant_accord=dominant_name,
        )

    def generate_ble_command(self, blend: AccordBlend, duration_s: int = DEFAULT_BLEND_DURATION_S) -> bytes:
        """
        Generate the BLE write payload for the scent command characteristic.

        The payload is a UTF-8 encoded JSON string matching the format
        expected by the ESP32 firmware:
            {"accords": [{"id": 0, "intensity": 85, "duration_ms": 30000}, ...]}

        Only accords with intensity > 0 are included.

        Args:
            blend: The AccordBlend to encode.
            duration_s: Duration in seconds for each accord.

        Returns:
            bytes: UTF-8 encoded JSON command.
        """
        duration_ms = duration_s * 1000
        accords_payload = []

        for accord in blend.accords:
            if accord.intensity > 0:
                accords_payload.append({
                    "id": accord.id,
                    "intensity": accord.intensity,
                    "duration_ms": duration_ms,
                })

        command = {"accords": accords_payload}
        return json.dumps(command, separators=(",", ":")).encode("utf-8")

    def generate_http_command(self, blend: AccordBlend, duration_s: int = DEFAULT_BLEND_DURATION_S) -> Dict[str, Any]:
        """
        Generate the HTTP POST body for the /blend endpoint.

        Args:
            blend: The AccordBlend to encode.
            duration_s: Duration in seconds for each accord.

        Returns:
            dict: JSON-serializable command dictionary.
        """
        duration_ms = duration_s * 1000
        accords_payload = []

        for accord in blend.accords:
            if accord.intensity > 0:
                accords_payload.append({
                    "id": accord.id,
                    "intensity": accord.intensity,
                    "duration_ms": duration_ms,
                })

        return {"accords": accords_payload}


# ---------------------------------------------------------------------------
# Display Helpers
# ---------------------------------------------------------------------------

def display_blend(blend: AccordBlend) -> None:
    """Pretty-print an AccordBlend to the terminal using rich."""
    console.print(Panel(
        f"[bold]{blend.formula_name}[/bold]\n"
        f"Total mapped: {blend.total_ingredient_percentage}%\n"
        f"Dominant accord: {blend.dominant_accord}",
        title="Accord Mapping",
        border_style="bright_yellow",
    ))

    table = Table(title="6-Channel Accord Blend")
    table.add_column("Ch", justify="center", width=4)
    table.add_column("Accord", width=10)
    table.add_column("Raw %", justify="right", width=8)
    table.add_column("Intensity", justify="right", width=10)
    table.add_column("Bar", width=30)
    table.add_column("Ingredients", width=40)

    for accord in blend.accords:
        bar_len = int(accord.intensity * 25 / 100)
        bar_char = "#"
        bar = bar_char * bar_len + "." * (25 - bar_len)

        ingredients_str = ", ".join(accord.contributing_ingredients[:5])
        if len(accord.contributing_ingredients) > 5:
            ingredients_str += f" (+{len(accord.contributing_ingredients) - 5} more)"

        table.add_row(
            str(accord.id),
            accord.name,
            f"{accord.raw_percentage:.1f}%",
            str(accord.intensity),
            f"[{accord.color_hex}]{bar}[/]",
            ingredients_str,
        )

    console.print(table)


def display_ble_command(data: bytes) -> None:
    """Display the BLE command payload."""
    console.print(Panel(
        f"[cyan]Characteristic:[/cyan] {BLE_CHAR_SCENT_CMD_UUID}\n"
        f"[cyan]Payload size:[/cyan] {len(data)} bytes\n"
        f"[cyan]Payload:[/cyan] {data.decode('utf-8')}",
        title="BLE Command",
        border_style="blue",
    ))


def display_http_command(cmd: Dict) -> None:
    """Display the HTTP command payload."""
    console.print(Panel(
        f"[cyan]Endpoint:[/cyan] POST /blend\n"
        f"[cyan]Content-Type:[/cyan] application/json\n"
        f"[cyan]Body:[/cyan]\n{json.dumps(cmd, indent=2)}",
        title="HTTP Command",
        border_style="green",
    ))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

@click.command()
@click.option(
    "--file", "-f",
    required=True,
    type=click.Path(exists=True),
    help="Path to OSC JSON formula file",
)
@click.option(
    "--duration", "-d",
    default=DEFAULT_BLEND_DURATION_S,
    type=int,
    help=f"Blend duration in seconds (default: {DEFAULT_BLEND_DURATION_S})",
)
@click.option(
    "--format", "-o",
    type=click.Choice(["table", "ble", "http", "json", "all"]),
    default="all",
    help="Output format (default: all)",
)
def main(file: str, duration: int, format: str) -> None:
    """Map an OSC formula to 6 accord channels for the portable device."""
    # Load the formula
    with open(file, "r", encoding="utf-8") as f:
        formula = json.load(f)

    mapper = AccordMapper()
    blend = mapper.map_formula(formula)

    # Display based on requested format
    if format in ("table", "all"):
        display_blend(blend)

    if format in ("ble", "all"):
        ble_cmd = mapper.generate_ble_command(blend, duration)
        display_ble_command(ble_cmd)

    if format in ("http", "all"):
        http_cmd = mapper.generate_http_command(blend, duration)
        display_http_command(http_cmd)

    if format == "json":
        output = {
            "blend": {
                "formula_name": blend.formula_name,
                "dominant_accord": blend.dominant_accord,
                "accords": [
                    {
                        "id": a.id,
                        "name": a.name,
                        "raw_percentage": a.raw_percentage,
                        "intensity": a.intensity,
                        "contributing_ingredients": a.contributing_ingredients,
                    }
                    for a in blend.accords
                ],
            },
            "ble_command": mapper.generate_ble_command(blend, duration).decode("utf-8"),
            "http_command": mapper.generate_http_command(blend, duration),
        }
        console.print_json(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
