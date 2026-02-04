"""
Prompt and Smell -- Ultrasonic Diffuser Configuration
------------------------------------------------------
Central configuration for the ultrasonic piezo atomizer-based scent diffusing
system. Contains GPIO pin mappings, atomizer channel definitions, timing
constraints, intensity presets, and safety limits.

This module is designed for Raspberry Pi (BCM numbering) with 16 ultrasonic
piezoelectric atomizer discs, each driven by a MOSFET controlled via GPIO.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import json
import os

# ---------------------------------------------------------------------------
# GPIO Pin Assignments (BCM Numbering)
# ---------------------------------------------------------------------------
# Two 8-channel MOSFET driver boards are used. Each MOSFET gate is driven
# by a GPIO pin. When the GPIO pin goes HIGH, the MOSFET conducts and
# powers the corresponding piezo atomizer disc.

# Board 1: Channels 0-7
# Board 2: Channels 8-15
# Fan: Separate GPIO pin

FAN_GPIO_PIN = 18                # PWM-capable pin for fan speed control
LED_STATUS_PIN = 12              # Optional NeoPixel LED ring data pin
OLED_SDA_PIN = 2                 # I2C SDA for SSD1306 OLED display
OLED_SCL_PIN = 3                 # I2C SCL for SSD1306 OLED display

# Atomizer channel GPIO pin mapping (BCM numbering)
ATOMIZER_GPIO_PINS: Dict[int, int] = {
    0: 4,       # Board 1, CH1
    1: 17,      # Board 1, CH2
    2: 27,      # Board 1, CH3
    3: 22,      # Board 1, CH4
    4: 5,       # Board 1, CH5
    5: 6,       # Board 1, CH6
    6: 13,      # Board 1, CH7
    7: 19,      # Board 1, CH8
    8: 26,      # Board 2, CH1
    9: 21,      # Board 2, CH2
    10: 20,     # Board 2, CH3
    11: 16,     # Board 2, CH4
    12: 24,     # Board 2, CH5
    13: 25,     # Board 2, CH6
    14: 8,      # Board 2, CH7
    15: 7,      # Board 2, CH8
}

# ---------------------------------------------------------------------------
# Atomizer Timing Settings
# ---------------------------------------------------------------------------

NUM_CHANNELS = 16
MIN_ACTIVATION_TIME_S = 0.5      # Minimum time to activate an atomizer (seconds)
MAX_ACTIVATION_TIME_S = 10.0     # Maximum single activation burst (seconds)
DEFAULT_ACTIVATION_TIME_S = 3.0  # Default activation for medium intensity
FAN_SPIN_UP_DELAY_S = 0.3       # Time for the fan to reach speed before atomizing
FAN_CLEAR_DURATION_S = 15.0     # How long to run the fan to clear residual scent
INTER_CHANNEL_DELAY_S = 0.1     # Delay between sequential channel activations
COOLDOWN_BETWEEN_RUNS_S = 5.0   # Minimum time between full dispensing cycles
MAX_TOTAL_ACTIVATION_S = 60.0   # Maximum total activation time across all channels in one run
MAX_SIMULTANEOUS_CHANNELS = 8   # Max channels active at once (power budget)

# ---------------------------------------------------------------------------
# Intensity Presets
# ---------------------------------------------------------------------------
# Each preset defines a multiplier applied to the calculated activation time.
# A multiplier of 1.0 means the full calculated time is used.

INTENSITY_PRESETS: Dict[str, float] = {
    "whisper": 0.15,    # Barely perceptible -- very short bursts
    "low": 0.30,        # Subtle background scent
    "medium": 0.60,     # Comfortable room-filling scent
    "high": 0.85,       # Strong, clearly noticeable
    "max": 1.00,        # Full activation time
}

DEFAULT_INTENSITY = "medium"

# ---------------------------------------------------------------------------
# Transition Settings
# ---------------------------------------------------------------------------
# Transition mode gradually fades from one scent profile to another over
# a configurable duration. This is achieved by ramping down the old profile's
# activation times while ramping up the new profile's activation times.

TRANSITION_STEPS = 10            # Number of intermediate blend steps
TRANSITION_DURATION_S = 30.0     # Total transition time (seconds)
TRANSITION_PAUSE_S = 1.0         # Pause between transition steps
TRANSITION_FAN_CLEAR_S = 2.0    # Brief fan clear between transition steps

# ---------------------------------------------------------------------------
# Blending Modes
# ---------------------------------------------------------------------------

BLEND_MODE_SIMULTANEOUS = "simultaneous"   # All channels activate at once
BLEND_MODE_SEQUENTIAL = "sequential"       # Channels activate one after another
BLEND_MODE_LAYERED = "layered"             # Base first, then heart, then top

DEFAULT_BLEND_MODE = BLEND_MODE_SIMULTANEOUS

# ---------------------------------------------------------------------------
# File Paths
# ---------------------------------------------------------------------------

CONFIG_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_HARDWARE_DIR = os.path.dirname(CONFIG_DIR)
INGREDIENT_MAP_PATH = os.path.join(PARENT_HARDWARE_DIR, "ingredient_map.json")

# ---------------------------------------------------------------------------
# Default Channel-to-Ingredient Mapping (16-Ingredient Starter Palette)
# ---------------------------------------------------------------------------
# Each atomizer channel has a small reservoir (10ml vial) filled with a
# pre-diluted scent solution. Ingredients are diluted in DPG (Dipropylene
# Glycol) to 5-10% concentration for safe ultrasonic atomization.

DEFAULT_CHANNEL_MAP: Dict[int, Dict] = {
    0: {
        "ingredient": "Bergamot Oil",
        "cas": "8007-75-8",
        "category": "citrus",
        "note_type": "top",
        "dilution_pct": 10.0,
        "description": "Bright citrus, slightly floral, tea-like",
    },
    1: {
        "ingredient": "Linalool",
        "cas": "78-70-6",
        "category": "fresh-floral",
        "note_type": "top",
        "dilution_pct": 10.0,
        "description": "Fresh, clean, lavender-like floral",
    },
    2: {
        "ingredient": "Dihydromyrcenol",
        "cas": "18479-58-8",
        "category": "fresh",
        "note_type": "top",
        "dilution_pct": 10.0,
        "description": "Clean, citrus-metallic, laundry-fresh",
    },
    3: {
        "ingredient": "Hedione",
        "cas": "24851-98-7",
        "category": "fresh-floral",
        "note_type": "heart",
        "dilution_pct": 10.0,
        "description": "Transparent jasmine, airy, radiant",
    },
    4: {
        "ingredient": "Rose Absolute",
        "cas": "8007-01-0",
        "category": "floral",
        "note_type": "heart",
        "dilution_pct": 5.0,
        "description": "Rich, deep, honeyed rose with spicy facets",
    },
    5: {
        "ingredient": "Jasmine Absolute",
        "cas": "8022-96-6",
        "category": "floral",
        "note_type": "heart",
        "dilution_pct": 5.0,
        "description": "Warm, intensely floral, indolic, fruity",
    },
    6: {
        "ingredient": "Geranium Oil",
        "cas": "8000-46-2",
        "category": "floral-green",
        "note_type": "heart",
        "dilution_pct": 10.0,
        "description": "Green, rosy, minty-herbaceous",
    },
    7: {
        "ingredient": "Lavender Oil",
        "cas": "8000-28-0",
        "category": "aromatic",
        "note_type": "heart",
        "dilution_pct": 10.0,
        "description": "Clean, herbaceous, floral, camphoraceous",
    },
    8: {
        "ingredient": "Iso E Super",
        "cas": "54464-57-2",
        "category": "woody",
        "note_type": "base",
        "dilution_pct": 10.0,
        "description": "Smooth, velvety cedarwood, skin-like warmth",
    },
    9: {
        "ingredient": "Cedarwood Oil (Atlas)",
        "cas": "8000-27-9",
        "category": "woody",
        "note_type": "base",
        "dilution_pct": 10.0,
        "description": "Warm pencil-shavings woody, slight camphor",
    },
    10: {
        "ingredient": "Sandalwood Oil",
        "cas": "8006-87-9",
        "category": "woody",
        "note_type": "base",
        "dilution_pct": 5.0,
        "description": "Creamy, smooth, warm, milky wood",
    },
    11: {
        "ingredient": "Patchouli Oil",
        "cas": "8014-09-3",
        "category": "earthy",
        "note_type": "base",
        "dilution_pct": 5.0,
        "description": "Dark, earthy, camphoraceous, sweet, chocolate",
    },
    12: {
        "ingredient": "Vanillin",
        "cas": "121-33-5",
        "category": "gourmand",
        "note_type": "base",
        "dilution_pct": 10.0,
        "description": "Sweet, creamy vanilla, slight chocolate",
    },
    13: {
        "ingredient": "Ambroxan",
        "cas": "6790-58-5",
        "category": "amber",
        "note_type": "base",
        "dilution_pct": 10.0,
        "description": "Warm, dry, salty, woody-amber, mineral",
    },
    14: {
        "ingredient": "Galaxolide",
        "cas": "1222-05-5",
        "category": "musk",
        "note_type": "base",
        "dilution_pct": 10.0,
        "description": "Clean, sweet, powdery musk, laundry-like",
    },
    15: {
        "ingredient": "Frankincense Oil",
        "cas": "8016-36-2",
        "category": "balsamic",
        "note_type": "base",
        "dilution_pct": 10.0,
        "description": "Fresh, lemony-resinous, incense-smoke quality",
    },
}


# ---------------------------------------------------------------------------
# Data Classes
# ---------------------------------------------------------------------------

@dataclass
class AtomizerChannelConfig:
    """Configuration for a single atomizer channel."""
    channel: int
    gpio_pin: int
    ingredient: str
    cas: str
    category: str
    note_type: str
    dilution_pct: float = 10.0
    description: str = ""
    enabled: bool = True
    max_activation_s: float = MAX_ACTIVATION_TIME_S
    min_activation_s: float = MIN_ACTIVATION_TIME_S


@dataclass
class DiffuserHardwareConfig:
    """Complete hardware configuration for the ultrasonic diffuser."""
    num_channels: int = NUM_CHANNELS
    fan_pin: int = FAN_GPIO_PIN
    led_pin: int = LED_STATUS_PIN
    intensity: str = DEFAULT_INTENSITY
    blend_mode: str = DEFAULT_BLEND_MODE
    channels: Dict[int, AtomizerChannelConfig] = field(default_factory=dict)

    def load_channel_map(self, path: Optional[str] = None) -> None:
        """Load channel mapping from the existing ingredient_map.json or defaults."""
        map_path = path or INGREDIENT_MAP_PATH
        loaded_from_file = False

        if os.path.exists(map_path):
            try:
                with open(map_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                channels_data = data.get("channels", [])
                for ch in channels_data:
                    channel_num = ch["channel"]
                    if channel_num < self.num_channels:
                        gpio_pin = ATOMIZER_GPIO_PINS.get(channel_num, -1)
                        self.channels[channel_num] = AtomizerChannelConfig(
                            channel=channel_num,
                            gpio_pin=gpio_pin,
                            ingredient=ch["ingredient"],
                            cas=ch.get("cas", ""),
                            category=ch.get("category", ""),
                            note_type=ch.get("noteType", ch.get("note_type", "heart")),
                            dilution_pct=ch.get("dilution_pct", 10.0),
                            description=ch.get("notes", ""),
                        )
                loaded_from_file = True
            except (json.JSONDecodeError, KeyError):
                loaded_from_file = False

        if not loaded_from_file:
            for ch_num, ch_data in DEFAULT_CHANNEL_MAP.items():
                gpio_pin = ATOMIZER_GPIO_PINS.get(ch_num, -1)
                self.channels[ch_num] = AtomizerChannelConfig(
                    channel=ch_num,
                    gpio_pin=gpio_pin,
                    ingredient=ch_data["ingredient"],
                    cas=ch_data["cas"],
                    category=ch_data["category"],
                    note_type=ch_data["note_type"],
                    dilution_pct=ch_data["dilution_pct"],
                    description=ch_data["description"],
                )

    def find_channel_for_ingredient(self, ingredient_name: str) -> Optional[int]:
        """Find the atomizer channel assigned to an ingredient (case-insensitive)."""
        name_lower = ingredient_name.lower().strip()
        # Exact match first
        for ch_num, ch_cfg in self.channels.items():
            if ch_cfg.ingredient.lower() == name_lower:
                return ch_num
        # Partial match fallback
        for ch_num, ch_cfg in self.channels.items():
            if name_lower in ch_cfg.ingredient.lower() or ch_cfg.ingredient.lower() in name_lower:
                return ch_num
        return None

    def get_intensity_multiplier(self) -> float:
        """Return the intensity multiplier for the current intensity preset."""
        return INTENSITY_PRESETS.get(self.intensity, INTENSITY_PRESETS[DEFAULT_INTENSITY])

    def list_ingredients(self) -> List[str]:
        """Return a sorted list of all loaded ingredient names."""
        return sorted(ch.ingredient for ch in self.channels.values())


def load_diffuser_config(
    intensity: str = DEFAULT_INTENSITY,
    blend_mode: str = DEFAULT_BLEND_MODE,
    channel_map_path: Optional[str] = None,
) -> DiffuserHardwareConfig:
    """Create and return a fully initialized DiffuserHardwareConfig."""
    cfg = DiffuserHardwareConfig(
        intensity=intensity,
        blend_mode=blend_mode,
    )
    cfg.load_channel_map(channel_map_path)
    return cfg
