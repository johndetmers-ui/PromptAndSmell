"""
Prompt and Smell -- Hardware Configuration
-------------------------------------------
Central configuration for the scent dispensing hardware. Contains default
pump-to-ingredient mappings, serial port settings, flow rate defaults,
volume constraints, and safety limits.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import json
import os

# ---------------------------------------------------------------------------
# Serial Communication Settings
# ---------------------------------------------------------------------------

SERIAL_PORT_DEFAULT = "COM3"         # Windows default; /dev/ttyACM0 on Linux
SERIAL_BAUD_RATE = 115200
SERIAL_TIMEOUT = 2.0                 # seconds
SERIAL_WRITE_TIMEOUT = 2.0           # seconds
SERIAL_RECONNECT_DELAY = 1.0        # seconds between reconnect attempts
SERIAL_MAX_RECONNECT_ATTEMPTS = 5

# ---------------------------------------------------------------------------
# Pump Hardware Settings
# ---------------------------------------------------------------------------

NUM_CHANNELS = 16                    # Total pump channels on the array
PUMP_PWM_FREQUENCY = 1000           # Hz, for PWM speed control if supported

# Flow rate defaults (ml per minute) for standard peristaltic pumps
# These values assume 12V DC peristaltic pumps with standard silicone tubing
DEFAULT_FLOW_RATE_ML_PER_MIN = 2.5
MIN_FLOW_RATE_ML_PER_MIN = 0.1
MAX_FLOW_RATE_ML_PER_MIN = 10.0

# ---------------------------------------------------------------------------
# Volume Constraints
# ---------------------------------------------------------------------------

MIN_DISPENSE_VOLUME_ML = 0.01       # Minimum dispensable volume (10 uL)
MAX_DISPENSE_VOLUME_ML = 50.0       # Maximum single dispense volume
MAX_TOTAL_VOLUME_ML = 100.0         # Maximum total formula volume
DEFAULT_TOTAL_VOLUME_ML = 5.0       # Default output volume

# Minimum pump actuation time in milliseconds.  Below this threshold the
# pump cannot reliably deliver a controlled amount of liquid.
MIN_PUMP_DURATION_MS = 50
MAX_PUMP_DURATION_MS = 300000       # 5 minutes max continuous run

# ---------------------------------------------------------------------------
# Safety Limits
# ---------------------------------------------------------------------------

MAX_INGREDIENT_PERCENTAGE = 85.0    # No single ingredient above 85%
MAX_CONSECUTIVE_DISPENSES = 50      # Max dispenses before mandatory pause
FLUSH_DURATION_MS = 5000            # Default flush duration
INTER_PUMP_DELAY_MS = 200           # Delay between sequential pump actuations
EMERGENCY_STOP_TIMEOUT_MS = 500     # Time to fully halt all pumps

# ---------------------------------------------------------------------------
# File Paths
# ---------------------------------------------------------------------------

CONFIG_DIR = os.path.dirname(os.path.abspath(__file__))
INGREDIENT_MAP_PATH = os.path.join(CONFIG_DIR, "ingredient_map.json")
CALIBRATION_DATA_PATH = os.path.join(CONFIG_DIR, "calibration.json")

# ---------------------------------------------------------------------------
# Default Channel Mapping
# ---------------------------------------------------------------------------
# This mapping is used when no ingredient_map.json file exists. It assigns
# common base and aroma ingredients to the 16 available pump channels.

DEFAULT_CHANNEL_MAP: Dict[int, Dict] = {
    0: {
        "ingredient": "Ethanol (denatured)",
        "cas": "64-17-5",
        "category": "carrier",
        "flow_rate_ml_per_min": 5.0,
        "max_volume_ml": 50.0,
    },
    1: {
        "ingredient": "Dipropylene Glycol (DPG)",
        "cas": "25265-71-8",
        "category": "carrier",
        "flow_rate_ml_per_min": 3.0,
        "max_volume_ml": 30.0,
    },
    2: {
        "ingredient": "Isopropyl Myristate (IPM)",
        "cas": "110-27-0",
        "category": "carrier",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 10.0,
    },
    3: {
        "ingredient": "Bergamot Oil",
        "cas": "8007-75-8",
        "category": "citrus",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 5.0,
    },
    4: {
        "ingredient": "Linalool",
        "cas": "78-70-6",
        "category": "fresh-floral",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 5.0,
    },
    5: {
        "ingredient": "Hedione",
        "cas": "24851-98-7",
        "category": "fresh-floral",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 10.0,
    },
    6: {
        "ingredient": "Rose Absolute",
        "cas": "8007-01-0",
        "category": "floral",
        "flow_rate_ml_per_min": 2.0,
        "max_volume_ml": 3.0,
    },
    7: {
        "ingredient": "Jasmine Absolute",
        "cas": "8022-96-6",
        "category": "floral",
        "flow_rate_ml_per_min": 2.0,
        "max_volume_ml": 3.0,
    },
    8: {
        "ingredient": "Iso E Super",
        "cas": "54464-57-2",
        "category": "woody",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 10.0,
    },
    9: {
        "ingredient": "Cedarwood Oil (Atlas)",
        "cas": "8000-27-9",
        "category": "woody",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 8.0,
    },
    10: {
        "ingredient": "Sandalwood Oil",
        "cas": "8006-87-9",
        "category": "woody",
        "flow_rate_ml_per_min": 2.0,
        "max_volume_ml": 5.0,
    },
    11: {
        "ingredient": "Vanillin",
        "cas": "121-33-5",
        "category": "gourmand",
        "flow_rate_ml_per_min": 2.0,
        "max_volume_ml": 5.0,
    },
    12: {
        "ingredient": "Ambroxan",
        "cas": "6790-58-5",
        "category": "amber",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 8.0,
    },
    13: {
        "ingredient": "Galaxolide",
        "cas": "1222-05-5",
        "category": "musk",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 8.0,
    },
    14: {
        "ingredient": "Patchouli Oil",
        "cas": "8014-09-3",
        "category": "woody-earthy",
        "flow_rate_ml_per_min": 2.0,
        "max_volume_ml": 5.0,
    },
    15: {
        "ingredient": "Dihydromyrcenol",
        "cas": "18479-58-8",
        "category": "fresh",
        "flow_rate_ml_per_min": 2.5,
        "max_volume_ml": 8.0,
    },
}


# ---------------------------------------------------------------------------
# Configuration Data Classes
# ---------------------------------------------------------------------------

@dataclass
class ChannelConfig:
    """Configuration for a single pump channel."""
    channel: int
    ingredient: str
    cas: str
    category: str
    flow_rate_ml_per_min: float = DEFAULT_FLOW_RATE_ML_PER_MIN
    max_volume_ml: float = MAX_DISPENSE_VOLUME_ML
    calibration_factor: float = 1.0   # Multiplier from calibration

    def effective_flow_rate(self) -> float:
        """Return the calibration-adjusted flow rate."""
        return self.flow_rate_ml_per_min * self.calibration_factor


@dataclass
class HardwareConfig:
    """Complete hardware configuration."""
    serial_port: str = SERIAL_PORT_DEFAULT
    baud_rate: int = SERIAL_BAUD_RATE
    serial_timeout: float = SERIAL_TIMEOUT
    num_channels: int = NUM_CHANNELS
    default_volume_ml: float = DEFAULT_TOTAL_VOLUME_ML
    channels: Dict[int, ChannelConfig] = field(default_factory=dict)

    def load_channel_map(self, path: Optional[str] = None) -> None:
        """Load channel mapping from a JSON file or use defaults."""
        map_path = path or INGREDIENT_MAP_PATH
        if os.path.exists(map_path):
            with open(map_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            channels_data = data.get("channels", [])
            for ch in channels_data:
                channel_num = ch["channel"]
                self.channels[channel_num] = ChannelConfig(
                    channel=channel_num,
                    ingredient=ch["ingredient"],
                    cas=ch.get("cas", ""),
                    category=ch.get("category", ""),
                    flow_rate_ml_per_min=ch.get(
                        "flow_rate_ml_per_min", DEFAULT_FLOW_RATE_ML_PER_MIN
                    ),
                    max_volume_ml=ch.get("max_volume_ml", MAX_DISPENSE_VOLUME_ML),
                    calibration_factor=ch.get("calibration_factor", 1.0),
                )
        else:
            for ch_num, ch_data in DEFAULT_CHANNEL_MAP.items():
                self.channels[ch_num] = ChannelConfig(
                    channel=ch_num,
                    ingredient=ch_data["ingredient"],
                    cas=ch_data["cas"],
                    category=ch_data["category"],
                    flow_rate_ml_per_min=ch_data["flow_rate_ml_per_min"],
                    max_volume_ml=ch_data["max_volume_ml"],
                )

    def load_calibration(self, path: Optional[str] = None) -> None:
        """Load calibration factors from calibration.json."""
        cal_path = path or CALIBRATION_DATA_PATH
        if not os.path.exists(cal_path):
            return
        with open(cal_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for entry in data.get("channels", []):
            ch_num = entry.get("channel")
            factor = entry.get("calibration_factor", 1.0)
            if ch_num is not None and ch_num in self.channels:
                self.channels[ch_num].calibration_factor = factor

    def find_channel_for_ingredient(self, ingredient_name: str) -> Optional[int]:
        """Find the pump channel assigned to a given ingredient (case-insensitive)."""
        name_lower = ingredient_name.lower()
        for ch_num, ch_cfg in self.channels.items():
            if ch_cfg.ingredient.lower() == name_lower:
                return ch_num
        # Partial match fallback
        for ch_num, ch_cfg in self.channels.items():
            if name_lower in ch_cfg.ingredient.lower() or ch_cfg.ingredient.lower() in name_lower:
                return ch_num
        return None


def load_config(
    serial_port: Optional[str] = None,
    channel_map_path: Optional[str] = None,
    calibration_path: Optional[str] = None,
) -> HardwareConfig:
    """Create and return a fully initialized HardwareConfig."""
    cfg = HardwareConfig()
    if serial_port:
        cfg.serial_port = serial_port
    cfg.load_channel_map(channel_map_path)
    cfg.load_calibration(calibration_path)
    return cfg
