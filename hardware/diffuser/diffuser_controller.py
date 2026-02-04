"""
Prompt and Smell -- Ultrasonic Diffuser Controller
----------------------------------------------------
Controller for ultrasonic piezo atomizer-based scent diffusing. Instead of
peristaltic pumps that mix liquid ingredients, this system uses 16 ultrasonic
piezoelectric atomizer discs, each sitting in a small reservoir of pre-diluted
scent solution. Each disc is powered through a MOSFET controlled via GPIO.
Atomizer activation time controls scent intensity (longer = more scent).
A small fan pushes the atomized scent toward the user.

Usage:
    python diffuser_controller.py --file scent.json --intensity medium --simulate
    python diffuser_controller.py --file scent.json --intensity high --blend layered
    python diffuser_controller.py --stdin --simulate
    python diffuser_controller.py --file scent.json --transition scent2.json --simulate

Classes:
    AtomizerChannel  -- represents one piezo atomizer disc and its GPIO control
    ScentBlender     -- handles blending logic and transition fading
    DiffuserController -- orchestrates the full diffusing session
"""

import argparse
import json
import logging
import sys
import time
import threading
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# GPIO Library Import (with fallback for non-Pi systems)
# ---------------------------------------------------------------------------

GPIO_AVAILABLE = False
GPIO_LIB = None

try:
    from gpiozero import OutputDevice, PWMOutputDevice
    GPIO_AVAILABLE = True
    GPIO_LIB = "gpiozero"
except ImportError:
    try:
        import RPi.GPIO as RPiGPIO
        GPIO_AVAILABLE = True
        GPIO_LIB = "RPi.GPIO"
    except ImportError:
        GPIO_AVAILABLE = False
        GPIO_LIB = None

# ---------------------------------------------------------------------------
# Rich Library Import (for formatted terminal output)
# ---------------------------------------------------------------------------

try:
    from rich.console import Console
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
    from rich.panel import Panel
    from rich.live import Live
    from rich.text import Text
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from config import (
    DiffuserHardwareConfig,
    AtomizerChannelConfig,
    load_diffuser_config,
    ATOMIZER_GPIO_PINS,
    FAN_GPIO_PIN,
    MIN_ACTIVATION_TIME_S,
    MAX_ACTIVATION_TIME_S,
    DEFAULT_ACTIVATION_TIME_S,
    FAN_SPIN_UP_DELAY_S,
    FAN_CLEAR_DURATION_S,
    INTER_CHANNEL_DELAY_S,
    COOLDOWN_BETWEEN_RUNS_S,
    MAX_TOTAL_ACTIVATION_S,
    MAX_SIMULTANEOUS_CHANNELS,
    INTENSITY_PRESETS,
    DEFAULT_INTENSITY,
    TRANSITION_STEPS,
    TRANSITION_DURATION_S,
    TRANSITION_PAUSE_S,
    TRANSITION_FAN_CLEAR_S,
    BLEND_MODE_SIMULTANEOUS,
    BLEND_MODE_SEQUENTIAL,
    BLEND_MODE_LAYERED,
    DEFAULT_BLEND_MODE,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("diffuser")

console = Console() if RICH_AVAILABLE else None


# ---------------------------------------------------------------------------
# Data Classes
# ---------------------------------------------------------------------------

@dataclass
class AtomizeStep:
    """One step in the atomization plan: which channel, how long to activate."""
    ingredient: str
    channel: int
    percentage: float
    activation_time_s: float
    note_type: str = ""
    cas: str = ""


@dataclass
class AtomizePlan:
    """Complete atomization plan derived from an OSC formula."""
    formula_name: str
    description: str
    steps: List[AtomizeStep] = field(default_factory=list)
    skipped: List[Dict] = field(default_factory=list)
    total_activation_s: float = 0.0
    intensity: str = DEFAULT_INTENSITY


# ---------------------------------------------------------------------------
# AtomizerChannel
# ---------------------------------------------------------------------------

class AtomizerChannel:
    """
    Represents a single ultrasonic piezo atomizer disc and its GPIO control.

    Each channel has:
    - A GPIO pin that drives a MOSFET gate
    - When HIGH, the MOSFET conducts and powers the piezo disc
    - The disc ultrasonically atomizes the scent solution in its reservoir
    - Activation duration controls how much scent is released
    """

    def __init__(
        self,
        channel_config: AtomizerChannelConfig,
        simulate: bool = False,
    ) -> None:
        self.config = channel_config
        self.channel = channel_config.channel
        self.gpio_pin = channel_config.gpio_pin
        self.ingredient = channel_config.ingredient
        self.simulate = simulate
        self._device = None
        self._active = False
        self._lock = threading.Lock()

        if not simulate and GPIO_AVAILABLE and GPIO_LIB == "gpiozero":
            self._device = OutputDevice(self.gpio_pin, active_high=True, initial_value=False)
        elif not simulate and GPIO_AVAILABLE and GPIO_LIB == "RPi.GPIO":
            RPiGPIO.setmode(RPiGPIO.BCM)
            RPiGPIO.setup(self.gpio_pin, RPiGPIO.OUT, initial=RPiGPIO.LOW)

    @property
    def is_active(self) -> bool:
        return self._active

    def activate(self, duration_s: float) -> None:
        """
        Activate the atomizer for the specified duration in seconds.
        Blocks for the duration of activation.
        """
        clamped = max(MIN_ACTIVATION_TIME_S, min(duration_s, self.config.max_activation_s))
        if clamped != duration_s:
            logger.debug(
                "Channel %d (%s): duration clamped from %.2fs to %.2fs",
                self.channel, self.ingredient, duration_s, clamped,
            )

        with self._lock:
            self._active = True
            if self.simulate:
                logger.info(
                    "SIMULATE: Channel %d (%s) ON for %.2fs",
                    self.channel, self.ingredient, clamped,
                )
            elif GPIO_AVAILABLE and GPIO_LIB == "gpiozero" and self._device:
                self._device.on()
            elif GPIO_AVAILABLE and GPIO_LIB == "RPi.GPIO":
                RPiGPIO.output(self.gpio_pin, RPiGPIO.HIGH)

        time.sleep(clamped)

        with self._lock:
            self._active = False
            if self.simulate:
                logger.info(
                    "SIMULATE: Channel %d (%s) OFF",
                    self.channel, self.ingredient,
                )
            elif GPIO_AVAILABLE and GPIO_LIB == "gpiozero" and self._device:
                self._device.off()
            elif GPIO_AVAILABLE and GPIO_LIB == "RPi.GPIO":
                RPiGPIO.output(self.gpio_pin, RPiGPIO.LOW)

    def activate_nonblocking(self, duration_s: float) -> threading.Thread:
        """
        Activate the atomizer in a background thread. Returns the thread handle.
        """
        t = threading.Thread(
            target=self.activate,
            args=(duration_s,),
            daemon=True,
            name=f"atomizer-ch{self.channel}",
        )
        t.start()
        return t

    def off(self) -> None:
        """Immediately turn off this atomizer."""
        with self._lock:
            self._active = False
            if self.simulate:
                logger.debug("SIMULATE: Channel %d (%s) forced OFF", self.channel, self.ingredient)
            elif GPIO_AVAILABLE and GPIO_LIB == "gpiozero" and self._device:
                self._device.off()
            elif GPIO_AVAILABLE and GPIO_LIB == "RPi.GPIO":
                RPiGPIO.output(self.gpio_pin, RPiGPIO.LOW)

    def cleanup(self) -> None:
        """Release GPIO resources."""
        self.off()
        if GPIO_AVAILABLE and GPIO_LIB == "gpiozero" and self._device:
            self._device.close()
            self._device = None


# ---------------------------------------------------------------------------
# Fan Controller
# ---------------------------------------------------------------------------

class FanController:
    """Controls the scent-projection fan via GPIO."""

    def __init__(self, pin: int, simulate: bool = False) -> None:
        self.pin = pin
        self.simulate = simulate
        self._device = None
        self._active = False

        if not simulate and GPIO_AVAILABLE:
            if GPIO_LIB == "gpiozero":
                self._device = PWMOutputDevice(pin, active_high=True, initial_value=0)
            elif GPIO_LIB == "RPi.GPIO":
                RPiGPIO.setmode(RPiGPIO.BCM)
                RPiGPIO.setup(pin, RPiGPIO.OUT, initial=RPiGPIO.LOW)

    def on(self, speed: float = 1.0) -> None:
        """Turn the fan on. Speed is 0.0 to 1.0 (PWM duty cycle)."""
        self._active = True
        clamped_speed = max(0.0, min(speed, 1.0))
        if self.simulate:
            logger.info("SIMULATE: Fan ON at %.0f%% speed", clamped_speed * 100)
        elif GPIO_AVAILABLE and GPIO_LIB == "gpiozero" and self._device:
            self._device.value = clamped_speed
        elif GPIO_AVAILABLE and GPIO_LIB == "RPi.GPIO":
            RPiGPIO.output(self.pin, RPiGPIO.HIGH)

    def off(self) -> None:
        """Turn the fan off."""
        self._active = False
        if self.simulate:
            logger.info("SIMULATE: Fan OFF")
        elif GPIO_AVAILABLE and GPIO_LIB == "gpiozero" and self._device:
            self._device.value = 0
        elif GPIO_AVAILABLE and GPIO_LIB == "RPi.GPIO":
            RPiGPIO.output(self.pin, RPiGPIO.LOW)

    @property
    def is_active(self) -> bool:
        return self._active

    def cleanup(self) -> None:
        """Release GPIO resources."""
        self.off()
        if GPIO_AVAILABLE and GPIO_LIB == "gpiozero" and self._device:
            self._device.close()
            self._device = None


# ---------------------------------------------------------------------------
# ScentBlender
# ---------------------------------------------------------------------------

class ScentBlender:
    """
    Handles scent blending logic: maps OSC formula ingredients to atomizer
    channels, calculates activation times based on percentages and intensity,
    and supports transition (crossfade) between two scent profiles.
    """

    def __init__(self, config: DiffuserHardwareConfig) -> None:
        self.config = config

    def create_plan(
        self,
        formula: Dict,
        intensity: str = DEFAULT_INTENSITY,
    ) -> AtomizePlan:
        """
        Create an AtomizePlan from an OSC formula dictionary.

        Activation time is proportional to the ingredient's percentage in the
        formula, scaled by the intensity preset multiplier. Higher percentage
        ingredients get longer atomization times, releasing more scent.
        """
        intensity_mult = INTENSITY_PRESETS.get(intensity, INTENSITY_PRESETS[DEFAULT_INTENSITY])

        plan = AtomizePlan(
            formula_name=formula.get("name", "Unnamed"),
            description=formula.get("description", ""),
            intensity=intensity,
        )

        ingredients = formula.get("ingredients", [])

        # Find the maximum percentage among aroma ingredients (exclude carrier)
        aroma_ingredients = [
            ing for ing in ingredients
            if ing.get("noteType", ing.get("note_type", "")).lower() != "carrier"
            and ing.get("category", "").lower() != "carrier"
        ]

        if not aroma_ingredients:
            logger.warning("No aroma ingredients found in formula (only carrier)")
            return plan

        max_pct = max(
            float(ing.get("percentage", 0)) for ing in aroma_ingredients
        ) if aroma_ingredients else 1.0

        if max_pct <= 0:
            max_pct = 1.0

        for item in aroma_ingredients:
            name = item.get("name", item.get("ingredient", "Unknown"))
            percentage = float(item.get("percentage", 0))
            note_type = item.get("noteType", item.get("note_type", ""))
            cas = item.get("cas", item.get("cas_number", ""))

            if percentage <= 0:
                continue

            # Find the atomizer channel for this ingredient
            channel = self.config.find_channel_for_ingredient(name)
            if channel is None:
                plan.skipped.append({
                    "ingredient": name,
                    "reason": "No atomizer channel assigned for this ingredient",
                    "percentage": percentage,
                })
                continue

            # Calculate activation time: proportional to percentage, scaled by intensity
            # The ingredient with the highest percentage gets the max activation time
            # (scaled by intensity). Other ingredients get proportionally less.
            normalized = percentage / max_pct
            activation_time = normalized * MAX_ACTIVATION_TIME_S * intensity_mult

            # Clamp to valid range
            activation_time = max(MIN_ACTIVATION_TIME_S, min(activation_time, MAX_ACTIVATION_TIME_S))

            plan.steps.append(AtomizeStep(
                ingredient=name,
                channel=channel,
                percentage=percentage,
                activation_time_s=round(activation_time, 2),
                note_type=note_type,
                cas=cas,
            ))

        # Sort steps by note type for layered blending
        note_order = {"base": 0, "heart": 1, "middle": 1, "top": 2}
        plan.steps.sort(key=lambda s: (note_order.get(s.note_type.lower(), 1), -s.activation_time_s))

        # Calculate total activation time
        plan.total_activation_s = sum(s.activation_time_s for s in plan.steps)

        # Safety check: total activation time
        if plan.total_activation_s > MAX_TOTAL_ACTIVATION_S:
            scale = MAX_TOTAL_ACTIVATION_S / plan.total_activation_s
            for step in plan.steps:
                step.activation_time_s = round(step.activation_time_s * scale, 2)
            plan.total_activation_s = sum(s.activation_time_s for s in plan.steps)
            logger.warning(
                "Total activation time exceeded limit (%.0fs). Scaled all durations by %.2f.",
                MAX_TOTAL_ACTIVATION_S, scale,
            )

        return plan

    def create_transition_plans(
        self,
        formula_from: Dict,
        formula_to: Dict,
        steps: int = TRANSITION_STEPS,
        intensity: str = DEFAULT_INTENSITY,
    ) -> List[AtomizePlan]:
        """
        Create a series of AtomizePlans that transition from one scent profile
        to another. Each plan represents one step in the crossfade.

        The transition works by:
        1. Starting with 100% of formula_from, 0% of formula_to
        2. Each step reduces formula_from by (100/steps)% and increases formula_to
        3. Ending with 0% of formula_from, 100% of formula_to
        """
        plans = []
        plan_from = self.create_plan(formula_from, intensity)
        plan_to = self.create_plan(formula_to, intensity)

        for i in range(steps + 1):
            blend_to = i / steps            # 0.0 -> 1.0
            blend_from = 1.0 - blend_to     # 1.0 -> 0.0

            transition_plan = AtomizePlan(
                formula_name=f"Transition {i}/{steps}: "
                             f"{plan_from.formula_name} -> {plan_to.formula_name}",
                description=f"Crossfade step {i}/{steps} "
                            f"({blend_from:.0%} old, {blend_to:.0%} new)",
                intensity=intensity,
            )

            # Add scaled steps from the "from" formula
            for step in plan_from.steps:
                if blend_from > 0.05:  # Skip if contribution is negligible
                    transition_plan.steps.append(AtomizeStep(
                        ingredient=step.ingredient,
                        channel=step.channel,
                        percentage=step.percentage * blend_from,
                        activation_time_s=round(step.activation_time_s * blend_from, 2),
                        note_type=step.note_type,
                        cas=step.cas,
                    ))

            # Add scaled steps from the "to" formula
            for step in plan_to.steps:
                if blend_to > 0.05:  # Skip if contribution is negligible
                    # Check if this channel is already in the plan (shared ingredient)
                    existing = next(
                        (s for s in transition_plan.steps if s.channel == step.channel),
                        None,
                    )
                    if existing:
                        # Combine activation times for shared channels
                        existing.activation_time_s = round(
                            existing.activation_time_s + step.activation_time_s * blend_to,
                            2,
                        )
                    else:
                        transition_plan.steps.append(AtomizeStep(
                            ingredient=step.ingredient,
                            channel=step.channel,
                            percentage=step.percentage * blend_to,
                            activation_time_s=round(step.activation_time_s * blend_to, 2),
                            note_type=step.note_type,
                            cas=step.cas,
                        ))

            # Filter out steps with negligible activation time
            transition_plan.steps = [
                s for s in transition_plan.steps
                if s.activation_time_s >= MIN_ACTIVATION_TIME_S
            ]

            transition_plan.total_activation_s = sum(
                s.activation_time_s for s in transition_plan.steps
            )
            plans.append(transition_plan)

        return plans


# ---------------------------------------------------------------------------
# DiffuserController
# ---------------------------------------------------------------------------

class DiffuserController:
    """
    Orchestrates the full scent diffusing process: loads formulas, builds
    atomization plans, controls atomizer channels and the fan, and supports
    blending modes and transitions.
    """

    def __init__(
        self,
        config: DiffuserHardwareConfig,
        simulate: bool = False,
    ) -> None:
        self.config = config
        self.simulate = simulate
        self.blender = ScentBlender(config)
        self.fan = FanController(config.fan_pin, simulate=simulate)

        # Initialize atomizer channels
        self.channels: Dict[int, AtomizerChannel] = {}
        for ch_num, ch_cfg in config.channels.items():
            self.channels[ch_num] = AtomizerChannel(ch_cfg, simulate=simulate)

        self._current_plan: Optional[AtomizePlan] = None
        self._last_run_time: float = 0.0
        self._running = False

        if not simulate and not GPIO_AVAILABLE:
            logger.warning(
                "GPIO libraries not available. Install gpiozero or RPi.GPIO "
                "for hardware control. Running in implicit simulation mode."
            )
            self.simulate = True

    @property
    def current_plan(self) -> Optional[AtomizePlan]:
        return self._current_plan

    def load_formula(self, source: str = "", from_stdin: bool = False) -> Dict:
        """Load an OSC formula from a file path or stdin."""
        if from_stdin:
            logger.info("Reading formula from stdin...")
            raw = sys.stdin.read()
        else:
            logger.info("Loading formula from: %s", source)
            with open(source, "r", encoding="utf-8") as f:
                raw = f.read()

        formula = json.loads(raw)

        if "ingredients" not in formula:
            raise ValueError("Formula JSON must contain an 'ingredients' array")

        return formula

    def display_plan(self, plan: AtomizePlan) -> None:
        """Display the atomization plan in a human-readable format."""
        if RICH_AVAILABLE and console:
            console.print(Panel(
                f"[bold]{plan.formula_name}[/bold]\n"
                f"{plan.description}\n"
                f"Intensity: {plan.intensity} "
                f"({INTENSITY_PRESETS.get(plan.intensity, 0.6):.0%})\n"
                f"Active channels: {len(plan.steps)}\n"
                f"Blend mode: {self.config.blend_mode}\n"
                f"Estimated time: {plan.total_activation_s:.1f}s "
                f"(+ fan overhead)",
                title="[bold]Diffuser Plan[/bold]",
                border_style="bright_cyan",
            ))

            table = Table(title="Atomization Steps")
            table.add_column("#", justify="right", width=4)
            table.add_column("Ingredient", width=28)
            table.add_column("Channel", justify="center", width=8)
            table.add_column("Note", justify="center", width=7)
            table.add_column("%", justify="right", width=7)
            table.add_column("Time (s)", justify="right", width=9)
            table.add_column("Bar", width=20)

            max_time = max((s.activation_time_s for s in plan.steps), default=1.0)

            for i, step in enumerate(plan.steps, 1):
                bar_len = int((step.activation_time_s / max_time) * 18)
                bar = "[bright_green]" + "|" * bar_len + "[/bright_green]"

                note_color = {
                    "top": "bright_yellow",
                    "heart": "bright_magenta",
                    "middle": "bright_magenta",
                    "base": "bright_blue",
                }.get(step.note_type.lower(), "white")

                table.add_row(
                    str(i),
                    step.ingredient,
                    str(step.channel),
                    f"[{note_color}]{step.note_type}[/{note_color}]",
                    f"{step.percentage:.1f}",
                    f"{step.activation_time_s:.2f}",
                    bar,
                )

            console.print(table)

            if plan.skipped:
                skip_table = Table(title="[yellow]Skipped Ingredients[/yellow]")
                skip_table.add_column("Ingredient", width=28)
                skip_table.add_column("Reason", width=48)
                skip_table.add_column("%", justify="right", width=7)
                for sk in plan.skipped:
                    skip_table.add_row(
                        sk["ingredient"],
                        sk["reason"],
                        f"{sk['percentage']:.1f}",
                    )
                console.print(skip_table)
        else:
            # Plain text fallback
            print(f"\n=== Diffuser Plan: {plan.formula_name} ===")
            print(f"Description: {plan.description}")
            print(f"Intensity: {plan.intensity}")
            print(f"Active channels: {len(plan.steps)}")
            print(f"Estimated time: {plan.total_activation_s:.1f}s\n")

            print(f"{'#':>3}  {'Ingredient':<28}  {'Ch':>3}  {'Note':<7}  "
                  f"{'%':>6}  {'Time(s)':>8}")
            print("-" * 70)
            for i, step in enumerate(plan.steps, 1):
                print(f"{i:>3}  {step.ingredient:<28}  {step.channel:>3}  "
                      f"{step.note_type:<7}  {step.percentage:>6.1f}  "
                      f"{step.activation_time_s:>8.2f}")

            if plan.skipped:
                print(f"\nSkipped ({len(plan.skipped)}):")
                for sk in plan.skipped:
                    print(f"  - {sk['ingredient']}: {sk['reason']}")

    def execute(self, plan: AtomizePlan) -> bool:
        """
        Execute an atomization plan using the configured blend mode.
        Returns True if completed successfully.
        """
        if not plan.steps:
            logger.warning("No atomizable steps in plan. Nothing to do.")
            return False

        # Check cooldown
        elapsed = time.time() - self._last_run_time
        if elapsed < COOLDOWN_BETWEEN_RUNS_S and self._last_run_time > 0:
            wait = COOLDOWN_BETWEEN_RUNS_S - elapsed
            logger.info("Cooldown: waiting %.1fs before next run...", wait)
            time.sleep(wait)

        self._current_plan = plan
        self._running = True
        success = True

        try:
            # Start fan for scent projection
            self.fan.on(speed=0.7)
            time.sleep(FAN_SPIN_UP_DELAY_S)

            blend_mode = self.config.blend_mode

            if blend_mode == BLEND_MODE_SIMULTANEOUS:
                success = self._execute_simultaneous(plan)
            elif blend_mode == BLEND_MODE_SEQUENTIAL:
                success = self._execute_sequential(plan)
            elif blend_mode == BLEND_MODE_LAYERED:
                success = self._execute_layered(plan)
            else:
                logger.warning("Unknown blend mode '%s', falling back to simultaneous", blend_mode)
                success = self._execute_simultaneous(plan)

            # Keep fan running briefly to push remaining scent
            time.sleep(1.0)
            self.fan.off()

        except KeyboardInterrupt:
            logger.warning("Interrupted by user -- stopping all atomizers")
            self.emergency_stop()
            success = False

        finally:
            self._running = False
            self._last_run_time = time.time()

        return success

    def _execute_simultaneous(self, plan: AtomizePlan) -> bool:
        """Activate all channels at the same time (in parallel threads)."""
        logger.info("Blend mode: SIMULTANEOUS -- activating %d channels in parallel", len(plan.steps))

        # Respect max simultaneous channels by batching
        batches = []
        current_batch = []
        for step in plan.steps:
            current_batch.append(step)
            if len(current_batch) >= MAX_SIMULTANEOUS_CHANNELS:
                batches.append(current_batch)
                current_batch = []
        if current_batch:
            batches.append(current_batch)

        for batch_idx, batch in enumerate(batches):
            if len(batches) > 1:
                logger.info("Batch %d/%d (%d channels)", batch_idx + 1, len(batches), len(batch))

            threads = []
            for step in batch:
                if step.channel in self.channels:
                    ch = self.channels[step.channel]
                    t = ch.activate_nonblocking(step.activation_time_s)
                    threads.append((step, t))
                else:
                    logger.warning("Channel %d not initialized, skipping %s", step.channel, step.ingredient)

            # Wait for all threads in this batch to complete
            for step, t in threads:
                t.join(timeout=step.activation_time_s + 5.0)

            if batch_idx < len(batches) - 1:
                time.sleep(INTER_CHANNEL_DELAY_S)

        return True

    def _execute_sequential(self, plan: AtomizePlan) -> bool:
        """Activate channels one at a time in order."""
        logger.info("Blend mode: SEQUENTIAL -- activating %d channels one by one", len(plan.steps))

        if RICH_AVAILABLE and console:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TimeElapsedColumn(),
                console=console,
            ) as progress:
                task = progress.add_task("Diffusing...", total=len(plan.steps))
                for step in plan.steps:
                    progress.update(
                        task,
                        description=f"[cyan]{step.ingredient}[/cyan] (ch{step.channel}, {step.activation_time_s:.1f}s)",
                    )
                    if step.channel in self.channels:
                        self.channels[step.channel].activate(step.activation_time_s)
                    time.sleep(INTER_CHANNEL_DELAY_S)
                    progress.advance(task)
        else:
            for i, step in enumerate(plan.steps, 1):
                logger.info(
                    "Step %d/%d: %s (ch%d, %.2fs)",
                    i, len(plan.steps), step.ingredient,
                    step.channel, step.activation_time_s,
                )
                if step.channel in self.channels:
                    self.channels[step.channel].activate(step.activation_time_s)
                time.sleep(INTER_CHANNEL_DELAY_S)

        return True

    def _execute_layered(self, plan: AtomizePlan) -> bool:
        """Activate channels in layers: base notes first, then heart, then top."""
        logger.info("Blend mode: LAYERED -- activating by note type (base -> heart -> top)")

        layers = {"base": [], "heart": [], "middle": [], "top": []}
        for step in plan.steps:
            key = step.note_type.lower()
            if key in layers:
                layers[key].append(step)
            else:
                layers["heart"].append(step)

        # Merge middle into heart
        layers["heart"].extend(layers.pop("middle", []))

        layer_order = ["base", "heart", "top"]
        for layer_name in layer_order:
            layer_steps = layers.get(layer_name, [])
            if not layer_steps:
                continue

            logger.info("Layer: %s (%d channels)", layer_name.upper(), len(layer_steps))
            if RICH_AVAILABLE and console:
                console.print(f"  [bold]{layer_name.upper()} notes[/bold]")

            # Activate all channels in this layer simultaneously
            threads = []
            for step in layer_steps:
                if step.channel in self.channels:
                    t = self.channels[step.channel].activate_nonblocking(step.activation_time_s)
                    threads.append((step, t))

            for step, t in threads:
                t.join(timeout=step.activation_time_s + 5.0)

            # Brief pause between layers
            time.sleep(INTER_CHANNEL_DELAY_S * 3)

        return True

    def execute_transition(
        self,
        formula_from: Dict,
        formula_to: Dict,
        intensity: str = DEFAULT_INTENSITY,
    ) -> bool:
        """
        Execute a smooth transition from one scent profile to another.
        Gradually fades out the old scent while fading in the new one.
        """
        logger.info(
            "Starting transition: %s -> %s",
            formula_from.get("name", "Unknown"),
            formula_to.get("name", "Unknown"),
        )

        plans = self.blender.create_transition_plans(
            formula_from, formula_to,
            steps=TRANSITION_STEPS,
            intensity=intensity,
        )

        if RICH_AVAILABLE and console:
            console.print(Panel(
                f"Transitioning from [bold]{formula_from.get('name', 'Unknown')}[/bold] "
                f"to [bold]{formula_to.get('name', 'Unknown')}[/bold]\n"
                f"Steps: {len(plans)}\n"
                f"Estimated duration: {len(plans) * (TRANSITION_PAUSE_S + 3):.0f}s",
                title="[bold]Scent Transition[/bold]",
                border_style="bright_magenta",
            ))

        self.fan.on(speed=0.5)
        time.sleep(FAN_SPIN_UP_DELAY_S)

        try:
            for i, plan in enumerate(plans):
                logger.info("Transition step %d/%d", i + 1, len(plans))

                if plan.steps:
                    # Use simultaneous mode for each transition step
                    old_mode = self.config.blend_mode
                    self.config.blend_mode = BLEND_MODE_SIMULTANEOUS
                    self._execute_simultaneous(plan)
                    self.config.blend_mode = old_mode

                # Brief fan burst to clear between steps
                self.fan.on(speed=1.0)
                time.sleep(TRANSITION_FAN_CLEAR_S)
                self.fan.on(speed=0.5)

                time.sleep(TRANSITION_PAUSE_S)

        except KeyboardInterrupt:
            logger.warning("Transition interrupted")
            self.emergency_stop()
            return False

        self.fan.off()
        logger.info("Transition complete")
        return True

    def clear_air(self) -> None:
        """Run the fan at full speed to clear residual scent from the air."""
        logger.info("Clearing air for %.0fs...", FAN_CLEAR_DURATION_S)
        if RICH_AVAILABLE and console:
            console.print("[bold yellow]Clearing the air...[/bold yellow]")
        self.fan.on(speed=1.0)
        time.sleep(FAN_CLEAR_DURATION_S)
        self.fan.off()
        logger.info("Air cleared")

    def emergency_stop(self) -> None:
        """Immediately stop all atomizers and the fan."""
        logger.warning("EMERGENCY STOP: turning off all channels and fan")
        for ch in self.channels.values():
            ch.off()
        self.fan.off()
        self._running = False

    def cleanup(self) -> None:
        """Release all GPIO resources."""
        for ch in self.channels.values():
            ch.cleanup()
        self.fan.cleanup()
        if GPIO_AVAILABLE and GPIO_LIB == "RPi.GPIO":
            try:
                RPiGPIO.cleanup()
            except Exception:
                pass

    def get_current_scent_info(self) -> Optional[Dict]:
        """Return info about the currently diffusing scent, if any."""
        if self._current_plan is None:
            return None
        plan = self._current_plan
        top_ingredients = sorted(plan.steps, key=lambda s: -s.percentage)[:5]
        return {
            "name": plan.formula_name,
            "description": plan.description,
            "intensity": plan.intensity,
            "top_ingredients": [
                {"name": s.ingredient, "percentage": s.percentage, "note_type": s.note_type}
                for s in top_ingredients
            ],
        }

    def run(
        self,
        formula_source: str = "",
        from_stdin: bool = False,
        intensity: str = DEFAULT_INTENSITY,
        transition_source: str = "",
    ) -> bool:
        """
        Full pipeline: load formula, build plan, display, execute.
        If transition_source is provided, performs a transition from the
        current formula to the transition target.
        """
        # Load primary formula
        formula = self.load_formula(source=formula_source, from_stdin=from_stdin)
        logger.info("Formula loaded: %s", formula.get("name", "Unnamed"))

        # If transition mode, load the target formula and crossfade
        if transition_source:
            formula_to = self.load_formula(source=transition_source)
            logger.info("Transition target loaded: %s", formula_to.get("name", "Unnamed"))
            return self.execute_transition(formula, formula_to, intensity=intensity)

        # Normal single-formula diffuse
        plan = self.blender.create_plan(formula, intensity=intensity)
        self.display_plan(plan)

        if not plan.steps:
            logger.error(
                "No ingredients could be mapped to atomizer channels. "
                "Check your channel configuration."
            )
            return False

        # Confirm unless simulating
        if not self.simulate:
            try:
                answer = input(
                    f"\nProceed with diffusing '{plan.formula_name}' "
                    f"at {intensity} intensity? [y/N] "
                )
                if answer.strip().lower() not in ("y", "yes"):
                    logger.info("Diffusing cancelled by user")
                    return False
            except EOFError:
                pass

        ok = self.execute(plan)

        if ok:
            logger.info("Diffusing completed successfully")
            if RICH_AVAILABLE and console:
                console.print("[bold green]Diffusing complete.[/bold green]")
        else:
            logger.error("Diffusing finished with errors")
            if RICH_AVAILABLE and console:
                console.print("[bold red]Diffusing finished with errors.[/bold red]")

        return ok


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prompt and Smell -- Ultrasonic Diffuser Controller",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python diffuser_controller.py --file scent.json --intensity medium --simulate\n"
            "  python diffuser_controller.py --file scent.json --intensity high --blend layered\n"
            "  python diffuser_controller.py --file from.json --transition to.json --simulate\n"
            "  cat scent.json | python diffuser_controller.py --stdin --simulate\n"
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
        "--intensity", "-i",
        choices=list(INTENSITY_PRESETS.keys()),
        default=DEFAULT_INTENSITY,
        help=f"Scent intensity preset (default: {DEFAULT_INTENSITY})",
    )
    parser.add_argument(
        "--blend", "-b",
        choices=[BLEND_MODE_SIMULTANEOUS, BLEND_MODE_SEQUENTIAL, BLEND_MODE_LAYERED],
        default=DEFAULT_BLEND_MODE,
        help=f"Blending mode (default: {DEFAULT_BLEND_MODE})",
    )
    parser.add_argument(
        "--transition", "-t",
        default=None,
        help="Path to a second OSC JSON file to transition to",
    )
    parser.add_argument(
        "--simulate", "-s",
        action="store_true",
        help="Simulation mode: print actions without GPIO control",
    )
    parser.add_argument(
        "--config", "-c",
        default=None,
        help="Path to a custom channel map JSON file",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Run the fan to clear the air (no scent diffused)",
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
    config = load_diffuser_config(
        intensity=args.intensity,
        blend_mode=args.blend,
        channel_map_path=args.config,
    )

    # Create controller
    controller = DiffuserController(config=config, simulate=args.simulate)

    try:
        # Clear air mode
        if args.clear:
            controller.clear_air()
            return

        # Run diffuser
        ok = controller.run(
            formula_source=args.file or "",
            from_stdin=args.stdin if hasattr(args, "stdin") and args.stdin else False,
            intensity=args.intensity,
            transition_source=args.transition or "",
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
        controller.emergency_stop()
        sys.exit(130)
    except Exception as exc:
        logger.error("Unexpected error: %s", exc, exc_info=True)
        sys.exit(1)
    finally:
        controller.cleanup()


if __name__ == "__main__":
    main()
