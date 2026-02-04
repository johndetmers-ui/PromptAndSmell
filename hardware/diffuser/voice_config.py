"""
Prompt and Smell -- Voice Controller Configuration
----------------------------------------------------
Configuration for the voice command system including wake word detection,
speech recognition engine selection, text-to-speech settings, API endpoints,
and hardware feedback pin assignments.
"""

from dataclasses import dataclass, field
from typing import List, Optional

# ---------------------------------------------------------------------------
# Wake Word Configuration
# ---------------------------------------------------------------------------

WAKE_WORDS: List[str] = [
    "hey scent",
    "ok scent",
    "okay scent",
    "hey sent",       # Common misrecognition
    "ok sent",        # Common misrecognition
    "hey cent",       # Common misrecognition
    "ok cent",        # Common misrecognition
]

# Minimum confidence threshold for wake word detection (0.0 to 1.0).
# Lower values accept more false positives but are more responsive.
WAKE_WORD_CONFIDENCE = 0.5

# ---------------------------------------------------------------------------
# Speech Recognition Engine
# ---------------------------------------------------------------------------
# Supported engines:
#   "google"  -- Google Web Speech API (free, requires internet)
#   "whisper" -- OpenAI Whisper (local, offline, requires openai-whisper package)
#   "sphinx"  -- CMU Sphinx (local, offline, lower accuracy)

SPEECH_ENGINE = "google"

# Google Speech Recognition settings
GOOGLE_LANGUAGE = "en-US"

# Whisper settings (only used if SPEECH_ENGINE == "whisper")
WHISPER_MODEL_SIZE = "base"       # tiny, base, small, medium, large
WHISPER_LANGUAGE = "en"
WHISPER_FP16 = False              # Set True if GPU with FP16 support is available

# Sphinx settings (only used if SPEECH_ENGINE == "sphinx")
SPHINX_LANGUAGE = "en-US"

# ---------------------------------------------------------------------------
# Microphone Settings
# ---------------------------------------------------------------------------

# Set to None for system default microphone, or specify a device index.
# Run `python -m speech_recognition` to list available microphones.
MICROPHONE_DEVICE_INDEX: Optional[int] = None

# Audio capture settings
SAMPLE_RATE = 16000               # Hz
PHRASE_TIME_LIMIT = 15            # Max seconds to listen for a single phrase
PAUSE_THRESHOLD = 1.5             # Seconds of silence before phrase is considered complete
ENERGY_THRESHOLD = 300            # Minimum audio energy to consider for recording
DYNAMIC_ENERGY_THRESHOLD = True   # Automatically adjust energy threshold to ambient noise

# ---------------------------------------------------------------------------
# API Configuration
# ---------------------------------------------------------------------------
# The voice controller sends transcribed text to a Claude API endpoint to
# generate scent formulas. It can use either the local web app API or the
# Anthropic API directly.

# Local web app API (Next.js server)
LOCAL_API_URL = "http://localhost:3000/api/generate"

# Direct Anthropic API
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"
ANTHROPIC_MAX_TOKENS = 4096

# Which API to use: "local" or "anthropic"
API_MODE = "anthropic"

# ---------------------------------------------------------------------------
# Text-to-Speech Settings
# ---------------------------------------------------------------------------

TTS_ENABLED = True
TTS_ENGINE = "pyttsx3"            # Currently only pyttsx3 is supported

# pyttsx3 settings
TTS_RATE = 175                    # Words per minute (default ~200, lower = slower)
TTS_VOLUME = 0.9                  # Volume from 0.0 to 1.0
TTS_VOICE_ID = None               # None = system default. Set to a specific voice ID string.
                                  # On macOS: "com.apple.speech.synthesis.voice.samantha"
                                  # On Linux: "english" or "english-us"
                                  # On Windows: usually auto-detected

# ---------------------------------------------------------------------------
# LED Feedback Configuration
# ---------------------------------------------------------------------------
# An optional NeoPixel LED ring provides visual feedback for the voice
# controller state. Set LED_FEEDBACK_ENABLED to False to disable.

LED_FEEDBACK_ENABLED = False
LED_FEEDBACK_PIN = 12             # GPIO pin (BCM) for NeoPixel data
LED_NUM_PIXELS = 16               # Number of LEDs in the ring
LED_BRIGHTNESS = 0.3              # Brightness from 0.0 to 1.0

# LED colors for different states (R, G, B tuples, 0-255)
LED_COLOR_IDLE = (0, 0, 30)               # Dim blue -- waiting for wake word
LED_COLOR_LISTENING = (255, 0, 0)          # Red -- actively listening
LED_COLOR_PROCESSING = (255, 165, 0)       # Orange -- processing with Claude
LED_COLOR_DIFFUSING = (0, 255, 0)          # Green -- diffusing scent
LED_COLOR_ERROR = (255, 0, 0)              # Red flash -- error

# ---------------------------------------------------------------------------
# Command Keywords
# ---------------------------------------------------------------------------
# These keywords are checked in the transcribed text after the wake word
# to handle follow-up commands without sending to the Claude API.

COMMAND_STRONGER = ["make it stronger", "stronger", "more intense", "turn it up", "louder"]
COMMAND_WEAKER = ["make it weaker", "weaker", "less intense", "turn it down", "softer"]
COMMAND_STOP = ["stop", "clear", "turn off", "shut off", "off", "cancel", "enough"]
COMMAND_INFO = ["what is this", "what's this", "what am i smelling", "current scent", "info"]
COMMAND_MORE_PREFIX = ["more"]     # "more woody", "more floral", etc.
COMMAND_LESS_PREFIX = ["less"]     # "less sweet", "less floral", etc.

# ---------------------------------------------------------------------------
# Session Settings
# ---------------------------------------------------------------------------

# Maximum number of iterations (follow-up modifications) per session before
# requiring a new base prompt.
MAX_ITERATIONS_PER_SESSION = 20

# Timeout for idle sessions (seconds). After this long with no voice input,
# the diffuser will stop and enter standby.
IDLE_TIMEOUT_S = 300              # 5 minutes

# Whether to save session history to a JSON file for later review.
SAVE_SESSION_HISTORY = True
SESSION_HISTORY_DIR = "sessions"


# ---------------------------------------------------------------------------
# Aggregate Configuration Dataclass
# ---------------------------------------------------------------------------

@dataclass
class VoiceConfig:
    """Complete voice controller configuration."""
    # Wake word
    wake_words: List[str] = field(default_factory=lambda: list(WAKE_WORDS))
    wake_word_confidence: float = WAKE_WORD_CONFIDENCE

    # Speech recognition
    speech_engine: str = SPEECH_ENGINE
    google_language: str = GOOGLE_LANGUAGE
    whisper_model_size: str = WHISPER_MODEL_SIZE
    whisper_language: str = WHISPER_LANGUAGE
    microphone_device_index: Optional[int] = MICROPHONE_DEVICE_INDEX
    phrase_time_limit: int = PHRASE_TIME_LIMIT
    pause_threshold: float = PAUSE_THRESHOLD
    energy_threshold: int = ENERGY_THRESHOLD
    dynamic_energy_threshold: bool = DYNAMIC_ENERGY_THRESHOLD

    # API
    api_mode: str = API_MODE
    local_api_url: str = LOCAL_API_URL
    anthropic_api_url: str = ANTHROPIC_API_URL
    anthropic_model: str = ANTHROPIC_MODEL
    anthropic_max_tokens: int = ANTHROPIC_MAX_TOKENS
    api_key: str = ""

    # TTS
    tts_enabled: bool = TTS_ENABLED
    tts_rate: int = TTS_RATE
    tts_volume: float = TTS_VOLUME
    tts_voice_id: Optional[str] = TTS_VOICE_ID

    # LED feedback
    led_enabled: bool = LED_FEEDBACK_ENABLED
    led_pin: int = LED_FEEDBACK_PIN
    led_num_pixels: int = LED_NUM_PIXELS
    led_brightness: float = LED_BRIGHTNESS

    # Session
    max_iterations: int = MAX_ITERATIONS_PER_SESSION
    idle_timeout_s: int = IDLE_TIMEOUT_S
    save_history: bool = SAVE_SESSION_HISTORY


def load_voice_config(api_key: str = "", engine: str = SPEECH_ENGINE) -> VoiceConfig:
    """Create and return a VoiceConfig with the given overrides."""
    return VoiceConfig(
        api_key=api_key,
        speech_engine=engine,
    )
