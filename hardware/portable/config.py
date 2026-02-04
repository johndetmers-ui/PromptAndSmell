"""
Prompt and Smell -- Portable Device Configuration
---------------------------------------------------
Central configuration for the portable scent device. Contains BLE/WiFi
settings, GPIO pin assignments, accord definitions, battery thresholds,
and timing parameters.

Configuration can be loaded from environment variables or a config file.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import json

# ---------------------------------------------------------------------------
# BLE Service and Characteristic UUIDs
# ---------------------------------------------------------------------------
# These must match the values defined in the ESP32 firmware.

BLE_SERVICE_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
BLE_CHAR_SCENT_CMD_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567891"
BLE_CHAR_STATUS_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567892"
BLE_CHAR_DEVICE_INFO_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567893"

# BLE device name prefix used for scanning/filtering
BLE_DEVICE_NAME_PREFIX = "PS-Portable"

# ---------------------------------------------------------------------------
# WiFi Configuration
# ---------------------------------------------------------------------------
# Load from environment variables or a local config file.

WIFI_SSID = os.environ.get("PS_WIFI_SSID", "")
WIFI_PASSWORD = os.environ.get("PS_WIFI_PASSWORD", "")
WIFI_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wifi_config.json")

def load_wifi_config() -> Tuple[str, str]:
    """Load WiFi credentials from environment or config file."""
    ssid = WIFI_SSID
    password = WIFI_PASSWORD
    if not ssid and os.path.exists(WIFI_CONFIG_FILE):
        with open(WIFI_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            ssid = data.get("ssid", "")
            password = data.get("password", "")
    return ssid, password

# ---------------------------------------------------------------------------
# ESP32 GPIO Pin Assignments
# ---------------------------------------------------------------------------
# These mirror the pin definitions in the firmware for reference by
# host-side tooling, documentation, and wiring verification.

GPIO_PINS = {
    "atomizer_0_floral": 25,
    "atomizer_1_woody": 26,
    "atomizer_2_fresh": 27,
    "atomizer_3_warm": 14,
    "atomizer_4_sweet": 12,
    "atomizer_5_clean": 13,
    "fan": 32,
    "neopixel": 33,
    "battery_adc": 34,
}

# ---------------------------------------------------------------------------
# Accord Definitions
# ---------------------------------------------------------------------------
# Each accord channel maps to a group of OSC ingredient categories.
# The color hex is used for UI display (matches the web app).

@dataclass
class AccordDefinition:
    """Definition of a single accord channel."""
    id: int
    name: str
    color_hex: str
    categories: List[str]
    description: str
    gpio_pin: int

ACCORD_DEFINITIONS: List[AccordDefinition] = [
    AccordDefinition(
        id=0,
        name="Floral",
        color_hex="#E91E90",
        categories=["floral", "powdery"],
        description="Rose, jasmine, iris, violet, geranium, ylang-ylang, and powdery florals",
        gpio_pin=25,
    ),
    AccordDefinition(
        id=1,
        name="Woody",
        color_hex="#8B6914",
        categories=["woody", "earthy", "smoky"],
        description="Sandalwood, cedar, vetiver, patchouli, oud, and earthy/smoky notes",
        gpio_pin=26,
    ),
    AccordDefinition(
        id=2,
        name="Fresh",
        color_hex="#00CED1",
        categories=["citrus", "green", "aquatic", "aromatic"],
        description="Bergamot, lemon, galbanum, calone, lavender (aromatic), and marine notes",
        gpio_pin=27,
    ),
    AccordDefinition(
        id=3,
        name="Warm",
        color_hex="#FF8C00",
        categories=["oriental", "amber", "balsamic", "spicy"],
        description="Vanilla, benzoin, cinnamon, frankincense, clove, and resinous orientals",
        gpio_pin=14,
    ),
    AccordDefinition(
        id=4,
        name="Sweet",
        color_hex="#FF69B4",
        categories=["gourmand", "fruity"],
        description="Caramel, chocolate, peach, raspberry, honey, and dessert-like notes",
        gpio_pin=12,
    ),
    AccordDefinition(
        id=5,
        name="Clean",
        color_hex="#87CEEB",
        categories=["musk", "fresh", "herbal"],
        description="Galaxolide, linalool, ambroxan, lavender (herbal), mint, and laundry musks",
        gpio_pin=13,
    ),
]

# Build a lookup from category name to accord ID for fast mapping
CATEGORY_TO_ACCORD: Dict[str, int] = {}
for accord in ACCORD_DEFINITIONS:
    for cat in accord.categories:
        CATEGORY_TO_ACCORD[cat] = accord.id

# Fallback for categories not explicitly listed above.
# "leather" and "animalic" are closest to WOODY (earthy, dark).
CATEGORY_FALLBACKS: Dict[str, int] = {
    "leather": 1,    # Woody channel
    "animalic": 1,   # Woody channel
}

def get_accord_for_category(category: str) -> int:
    """Return the accord channel ID for a given ingredient category."""
    cat_lower = category.lower().strip()
    if cat_lower in CATEGORY_TO_ACCORD:
        return CATEGORY_TO_ACCORD[cat_lower]
    if cat_lower in CATEGORY_FALLBACKS:
        return CATEGORY_FALLBACKS[cat_lower]
    # Default to CLEAN (channel 5) for unknown categories
    return 5

# ---------------------------------------------------------------------------
# Battery Voltage Thresholds
# ---------------------------------------------------------------------------
# LiPo battery voltage-to-percentage mapping used on the host side
# to display battery status from the raw voltage reported by the device.

BATTERY_FULL_VOLTAGE = 4.20
BATTERY_NOMINAL_VOLTAGE = 3.70
BATTERY_LOW_VOLTAGE = 3.50
BATTERY_CRITICAL_VOLTAGE = 3.30
BATTERY_EMPTY_VOLTAGE = 3.00

BATTERY_LOW_PERCENT = 20
BATTERY_CRITICAL_PERCENT = 10

# ---------------------------------------------------------------------------
# PWM and Timing
# ---------------------------------------------------------------------------

PWM_FREQUENCY_HZ = 40000        # Piezo atomizer PWM carrier frequency
FAN_PWM_FREQUENCY_HZ = 25000    # Micro blower PWM frequency
FAN_POST_DELAY_S = 3.0          # Fan clearing time after atomizers stop
MAX_CONTINUOUS_S = 30.0          # Max continuous atomizer run time
COOLDOWN_S = 5.0                 # Cooldown after max continuous run
DEEP_SLEEP_TIMEOUT_S = 300.0    # 5 minutes idle -> sleep

# ---------------------------------------------------------------------------
# Default Blend Settings
# ---------------------------------------------------------------------------

DEFAULT_BLEND_DURATION_S = 30     # Default diffusion duration in seconds
MIN_BLEND_DURATION_S = 5          # Minimum allowed duration
MAX_BLEND_DURATION_S = 300        # 5 minutes max for a single blend
MIN_INTENSITY = 0                 # Minimum accord intensity (off)
MAX_INTENSITY = 100               # Maximum accord intensity (full power)

# ---------------------------------------------------------------------------
# HTTP API
# ---------------------------------------------------------------------------

DEFAULT_HTTP_PORT = 80
HTTP_BLEND_ENDPOINT = "/blend"
HTTP_STATUS_ENDPOINT = "/status"
HTTP_STOP_ENDPOINT = "/stop"

# ---------------------------------------------------------------------------
# Composite Config Object
# ---------------------------------------------------------------------------

@dataclass
class PortableDeviceConfig:
    """Full configuration for the portable scent device."""
    ble_service_uuid: str = BLE_SERVICE_UUID
    ble_cmd_uuid: str = BLE_CHAR_SCENT_CMD_UUID
    ble_status_uuid: str = BLE_CHAR_STATUS_UUID
    ble_info_uuid: str = BLE_CHAR_DEVICE_INFO_UUID
    ble_name_prefix: str = BLE_DEVICE_NAME_PREFIX
    wifi_ssid: str = ""
    wifi_password: str = ""
    accords: List[AccordDefinition] = field(default_factory=lambda: list(ACCORD_DEFINITIONS))
    default_duration_s: int = DEFAULT_BLEND_DURATION_S
    max_duration_s: int = MAX_BLEND_DURATION_S

    def __post_init__(self):
        if not self.wifi_ssid:
            self.wifi_ssid, self.wifi_password = load_wifi_config()


def load_portable_config() -> PortableDeviceConfig:
    """Create and return a fully initialized PortableDeviceConfig."""
    return PortableDeviceConfig()
