"""
Prompt and Smell -- Voice-Activated Scent Controller
------------------------------------------------------
Voice-controlled interface for the ultrasonic diffuser. Listens for a wake
word, captures the user's scent description via speech recognition, sends
it to the Claude API for scent formula generation, and passes the resulting
OSC formula to the DiffuserController for atomization.

Supports follow-up voice commands for adjusting intensity, iterating on
the scent, stopping, and querying the current scent.

Usage:
    python voice_controller.py --api-key <KEY> --simulate
    python voice_controller.py --api-key <KEY> --engine whisper --simulate
    python voice_controller.py --api-key <KEY>

Requires:
    pip install speechrecognition pyaudio pyttsx3 anthropic rich
"""

import argparse
import json
import logging
import os
import sys
import time
import threading
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Optional Imports
# ---------------------------------------------------------------------------

try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    SR_AVAILABLE = False

try:
    import pyttsx3
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    from rich.live import Live
    from rich.spinner import Spinner
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from config import (
    load_diffuser_config,
    DiffuserHardwareConfig,
    INTENSITY_PRESETS,
    DEFAULT_INTENSITY,
)
from diffuser_controller import DiffuserController
from voice_config import (
    VoiceConfig,
    load_voice_config,
    WAKE_WORDS,
    COMMAND_STRONGER,
    COMMAND_WEAKER,
    COMMAND_STOP,
    COMMAND_INFO,
    COMMAND_MORE_PREFIX,
    COMMAND_LESS_PREFIX,
    MAX_ITERATIONS_PER_SESSION,
    IDLE_TIMEOUT_S,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("voice")

console = Console() if RICH_AVAILABLE else None

# ---------------------------------------------------------------------------
# System Prompt for Claude API (scent generation)
# ---------------------------------------------------------------------------

SCENT_SYSTEM_PROMPT = """You are a master perfumer AI. The user will describe a scent they want to experience.
Generate a fragrance formula as JSON.

You must respond with ONLY valid JSON in this format:
{
  "name": "Creative name for the fragrance",
  "description": "A poetic 1-2 sentence description of the scent",
  "ingredients": [
    {
      "name": "Ingredient Name",
      "cas": "CAS number",
      "category": "category",
      "percentage": 5.0,
      "noteType": "top|heart|base",
      "role": "What this contributes"
    }
  ],
  "carrier": {
    "name": "Ethanol (denatured)",
    "percentage": 80.0
  },
  "totalPercentage": 100.0
}

Available atomizer ingredients (you should primarily use these, as they are
physically loaded in the diffuser):
- Bergamot Oil (citrus, top)
- Linalool (fresh-floral, top)
- Dihydromyrcenol (fresh, top)
- Hedione (fresh-floral, heart)
- Rose Absolute (floral, heart)
- Jasmine Absolute (floral, heart)
- Geranium Oil (floral-green, heart)
- Lavender Oil (aromatic, heart)
- Iso E Super (woody, base)
- Cedarwood Oil Atlas (woody, base)
- Sandalwood Oil (woody, base)
- Patchouli Oil (earthy, base)
- Vanillin (gourmand, base)
- Ambroxan (amber, base)
- Galaxolide (musk, base)
- Frankincense Oil (balsamic, base)

You may include other ingredients in the formula for completeness, but the
diffuser will only atomize the ones listed above. Prioritize these ingredients.

CRITICAL: Percentages must sum to exactly 100.0. Respond with ONLY the JSON."""

ITERATE_SYSTEM_PROMPT = """You are a master perfumer AI. You will receive an existing fragrance formula
and a modification request. Modify the formula according to the request.

Rules:
- Make minimal changes to achieve the requested effect
- Maintain the 100% total percentage
- Keep the same JSON format
- Explain changes in a "perfumerNotes" field
- Respond with ONLY valid JSON"""


# ---------------------------------------------------------------------------
# TextToSpeech
# ---------------------------------------------------------------------------

class TextToSpeech:
    """Wrapper around pyttsx3 for spoken feedback."""

    def __init__(self, config: VoiceConfig) -> None:
        self.config = config
        self._engine = None
        self._lock = threading.Lock()

        if config.tts_enabled and TTS_AVAILABLE:
            try:
                self._engine = pyttsx3.init()
                self._engine.setProperty("rate", config.tts_rate)
                self._engine.setProperty("volume", config.tts_volume)
                if config.tts_voice_id:
                    self._engine.setProperty("voice", config.tts_voice_id)
                logger.info("Text-to-speech initialized (rate=%d, volume=%.1f)",
                            config.tts_rate, config.tts_volume)
            except Exception as exc:
                logger.warning("Could not initialize TTS: %s", exc)
                self._engine = None
        elif config.tts_enabled and not TTS_AVAILABLE:
            logger.warning("pyttsx3 not installed. TTS disabled. Install with: pip install pyttsx3")

    def speak(self, text: str) -> None:
        """Speak the given text. Blocks until speech completes."""
        if self._engine is None:
            logger.info("TTS (text only): %s", text)
            return

        with self._lock:
            try:
                self._engine.say(text)
                self._engine.runAndWait()
            except Exception as exc:
                logger.warning("TTS error: %s", exc)

    def speak_async(self, text: str) -> threading.Thread:
        """Speak in a background thread."""
        t = threading.Thread(target=self.speak, args=(text,), daemon=True)
        t.start()
        return t


# ---------------------------------------------------------------------------
# ScentAPIClient
# ---------------------------------------------------------------------------

class ScentAPIClient:
    """Sends scent generation requests to the Claude API."""

    def __init__(self, config: VoiceConfig) -> None:
        self.config = config
        self._client = None

        if config.api_mode == "anthropic" and ANTHROPIC_AVAILABLE and config.api_key:
            self._client = anthropic.Anthropic(api_key=config.api_key)
            logger.info("Anthropic API client initialized (model: %s)", config.anthropic_model)
        elif config.api_mode == "anthropic" and not ANTHROPIC_AVAILABLE:
            logger.warning(
                "anthropic package not installed. Install with: pip install anthropic"
            )
        elif config.api_mode == "anthropic" and not config.api_key:
            logger.warning("No API key provided. Set --api-key or ANTHROPIC_API_KEY env var.")

    def generate(self, prompt: str) -> Optional[Dict]:
        """Generate a scent formula from a text prompt. Returns parsed JSON or None."""
        if self._client is None:
            logger.error("API client not available. Cannot generate scent.")
            return None

        logger.info("Sending prompt to Claude API: '%s'", prompt[:80])

        try:
            message = self._client.messages.create(
                model=self.config.anthropic_model,
                max_tokens=self.config.anthropic_max_tokens,
                system=SCENT_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text.strip()

            # Try to extract JSON from the response
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.strip().startswith("```") and not in_json:
                        in_json = True
                        continue
                    elif line.strip().startswith("```") and in_json:
                        break
                    elif in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            formula = json.loads(response_text)
            logger.info("Generated formula: %s", formula.get("name", "Unnamed"))
            return formula

        except json.JSONDecodeError as exc:
            logger.error("Failed to parse API response as JSON: %s", exc)
            return None
        except Exception as exc:
            logger.error("API request failed: %s", exc)
            return None

    def iterate(self, current_formula: Dict, modification: str) -> Optional[Dict]:
        """Modify an existing formula based on a text instruction."""
        if self._client is None:
            logger.error("API client not available. Cannot iterate.")
            return None

        logger.info("Sending iteration to Claude API: '%s'", modification[:80])

        try:
            user_content = (
                f"Current formula:\n{json.dumps(current_formula, indent=2)}\n\n"
                f"Modification requested: {modification}"
            )

            message = self._client.messages.create(
                model=self.config.anthropic_model,
                max_tokens=self.config.anthropic_max_tokens,
                system=ITERATE_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_content}],
            )

            response_text = message.content[0].text.strip()

            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.strip().startswith("```") and not in_json:
                        in_json = True
                        continue
                    elif line.strip().startswith("```") and in_json:
                        break
                    elif in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            formula = json.loads(response_text)
            logger.info("Iterated formula: %s", formula.get("name", "Unnamed"))
            return formula

        except json.JSONDecodeError as exc:
            logger.error("Failed to parse iteration response as JSON: %s", exc)
            return None
        except Exception as exc:
            logger.error("Iteration API request failed: %s", exc)
            return None


# ---------------------------------------------------------------------------
# VoiceController
# ---------------------------------------------------------------------------

class VoiceController:
    """
    Main voice controller that ties together speech recognition, Claude API,
    text-to-speech, and the DiffuserController in a continuous listening loop.
    """

    def __init__(
        self,
        voice_config: VoiceConfig,
        diffuser_config: DiffuserHardwareConfig,
        simulate: bool = False,
    ) -> None:
        self.voice_config = voice_config
        self.simulate = simulate

        # Components
        self.diffuser = DiffuserController(diffuser_config, simulate=simulate)
        self.tts = TextToSpeech(voice_config)
        self.api = ScentAPIClient(voice_config)

        # Speech recognition
        self._recognizer = None
        self._microphone = None
        self._mic_available = False

        if SR_AVAILABLE:
            self._recognizer = sr.Recognizer()
            self._recognizer.pause_threshold = voice_config.pause_threshold
            self._recognizer.energy_threshold = voice_config.energy_threshold
            self._recognizer.dynamic_energy_threshold = voice_config.dynamic_energy_threshold

            try:
                self._microphone = sr.Microphone(
                    device_index=voice_config.microphone_device_index,
                    sample_rate=16000,
                )
                self._mic_available = True
                logger.info("Microphone initialized (device index: %s)",
                            voice_config.microphone_device_index or "default")
            except Exception as exc:
                logger.warning("No microphone detected: %s. Falling back to keyboard input.", exc)
                self._mic_available = False
        else:
            logger.warning(
                "speech_recognition not installed. Using keyboard input. "
                "Install with: pip install SpeechRecognition pyaudio"
            )

        # Session state
        self._current_formula: Optional[Dict] = None
        self._current_intensity = voice_config.wake_word_confidence  # Not used for intensity
        self._current_intensity_name = DEFAULT_INTENSITY
        self._iteration_count = 0
        self._running = False
        self._session_history: List[Dict] = []

    def _listen_for_speech(self) -> Optional[str]:
        """
        Listen for speech input. Uses microphone if available, otherwise
        falls back to keyboard input.

        Returns the transcribed text, or None if nothing was captured.
        """
        if not self._mic_available or not SR_AVAILABLE:
            # Keyboard fallback
            try:
                if RICH_AVAILABLE and console:
                    console.print("[dim]Type your command (or 'quit' to exit):[/dim]")
                text = input("> ").strip()
                if text.lower() in ("quit", "exit", "q"):
                    return None
                return text if text else None
            except (EOFError, KeyboardInterrupt):
                return None

        # Microphone input
        try:
            with self._microphone as source:
                if RICH_AVAILABLE and console:
                    console.print("[dim]Listening...[/dim]")
                else:
                    print("Listening...")

                audio = self._recognizer.listen(
                    source,
                    timeout=IDLE_TIMEOUT_S,
                    phrase_time_limit=self.voice_config.phrase_time_limit,
                )

            # Transcribe
            text = self._transcribe(audio)
            return text

        except sr.WaitTimeoutError:
            logger.debug("Listen timeout -- no speech detected")
            return None
        except Exception as exc:
            logger.warning("Error during listening: %s", exc)
            return None

    def _transcribe(self, audio) -> Optional[str]:
        """Transcribe audio to text using the configured engine."""
        engine = self.voice_config.speech_engine

        try:
            if engine == "google":
                text = self._recognizer.recognize_google(
                    audio,
                    language=self.voice_config.google_language,
                )
                logger.info("Google transcription: '%s'", text)
                return text

            elif engine == "whisper":
                try:
                    text = self._recognizer.recognize_whisper(
                        audio,
                        model=self.voice_config.whisper_model_size,
                        language=self.voice_config.whisper_language,
                    )
                    logger.info("Whisper transcription: '%s'", text)
                    return text
                except AttributeError:
                    logger.warning(
                        "Whisper recognition not available in this version of "
                        "speech_recognition. Falling back to Google."
                    )
                    text = self._recognizer.recognize_google(audio)
                    return text

            elif engine == "sphinx":
                text = self._recognizer.recognize_sphinx(
                    audio,
                    language=self.voice_config.google_language,
                )
                logger.info("Sphinx transcription: '%s'", text)
                return text

            else:
                logger.warning("Unknown engine '%s', using Google", engine)
                text = self._recognizer.recognize_google(audio)
                return text

        except sr.UnknownValueError:
            logger.debug("Could not understand audio")
            return None
        except sr.RequestError as exc:
            logger.warning("Speech recognition service error: %s", exc)
            return None

    def _detect_wake_word(self, text: str) -> Tuple[bool, str]:
        """
        Check if the text starts with a wake word. Returns (detected, remainder).
        The remainder is the text after the wake word.
        """
        text_lower = text.lower().strip()

        for wake_word in self.voice_config.wake_words:
            if text_lower.startswith(wake_word):
                remainder = text_lower[len(wake_word):].strip()
                # Strip common filler words that follow the wake word
                for filler in [",", ".", "please", "can you", "could you", "i want"]:
                    if remainder.startswith(filler):
                        remainder = remainder[len(filler):].strip()
                return True, remainder

        return False, text_lower

    def _classify_command(self, text: str) -> Tuple[str, str]:
        """
        Classify the user's command into a category and extract the payload.

        Returns (command_type, payload) where command_type is one of:
        - "generate": new scent request (payload = description)
        - "stronger": increase intensity
        - "weaker": decrease intensity
        - "stop": stop diffusing and clear air
        - "info": query current scent
        - "iterate": modify current scent (payload = modification)
        """
        text_lower = text.lower().strip()

        # Check stop commands
        for cmd in COMMAND_STOP:
            if text_lower == cmd or text_lower.startswith(cmd + " "):
                return "stop", ""

        # Check info commands
        for cmd in COMMAND_INFO:
            if text_lower == cmd or text_lower.startswith(cmd):
                return "info", ""

        # Check stronger commands
        for cmd in COMMAND_STRONGER:
            if cmd in text_lower:
                return "stronger", ""

        # Check weaker commands
        for cmd in COMMAND_WEAKER:
            if cmd in text_lower:
                return "weaker", ""

        # Check "more X" / "less X" iteration commands
        for prefix in COMMAND_MORE_PREFIX:
            if text_lower.startswith(prefix + " "):
                quality = text_lower[len(prefix):].strip()
                return "iterate", f"Make it more {quality}"

        for prefix in COMMAND_LESS_PREFIX:
            if text_lower.startswith(prefix + " "):
                quality = text_lower[len(prefix):].strip()
                return "iterate", f"Make it less {quality}"

        # Check if this looks like an iteration (modifying existing scent)
        iteration_keywords = [
            "make it", "add more", "add some", "reduce", "increase",
            "change", "adjust", "tweak",
        ]
        if self._current_formula is not None:
            for kw in iteration_keywords:
                if text_lower.startswith(kw):
                    return "iterate", text

        # Default: treat as a new scent generation request
        return "generate", text

    def _handle_generate(self, description: str) -> None:
        """Handle a new scent generation request."""
        if RICH_AVAILABLE and console:
            console.print(
                Panel(
                    f"[italic]\"{description}\"[/italic]",
                    title="[bold]Generating scent...[/bold]",
                    border_style="bright_cyan",
                )
            )

        self.tts.speak(f"Creating a scent for: {description}")

        formula = self.api.generate(description)
        if formula is None:
            self.tts.speak("Sorry, I could not generate a scent for that description.")
            return

        self._current_formula = formula
        self._iteration_count = 0

        # Build the scent name and top ingredients for TTS
        name = formula.get("name", "Unnamed Scent")
        desc = formula.get("description", "")
        ingredients = formula.get("ingredients", [])
        top_3 = sorted(
            [i for i in ingredients if i.get("noteType", i.get("note_type", "")) != "carrier"],
            key=lambda x: -float(x.get("percentage", 0)),
        )[:3]
        top_names = ", ".join(i.get("name", i.get("ingredient", "")) for i in top_3)

        self.tts.speak(f"Now diffusing: {name}. Top notes: {top_names}.")

        # Log to session history
        self._session_history.append({
            "timestamp": datetime.now().isoformat(),
            "type": "generate",
            "prompt": description,
            "formula_name": name,
        })

        # Diffuse
        plan = self.diffuser.blender.create_plan(formula, intensity=self._current_intensity_name)
        self.diffuser.display_plan(plan)
        if plan.steps:
            self.diffuser.execute(plan)

    def _handle_iterate(self, modification: str) -> None:
        """Handle an iteration/modification of the current scent."""
        if self._current_formula is None:
            self.tts.speak("No scent is currently active. Please describe a new scent first.")
            return

        if self._iteration_count >= MAX_ITERATIONS_PER_SESSION:
            self.tts.speak(
                f"You have reached the maximum of {MAX_ITERATIONS_PER_SESSION} "
                "iterations. Please start with a new scent description."
            )
            return

        if RICH_AVAILABLE and console:
            console.print(f"[yellow]Iterating:[/yellow] {modification}")

        self.tts.speak(f"Adjusting the scent: {modification}")

        formula = self.api.iterate(self._current_formula, modification)
        if formula is None:
            self.tts.speak("Sorry, I could not modify the scent.")
            return

        self._current_formula = formula
        self._iteration_count += 1

        name = formula.get("name", "Updated Scent")
        self.tts.speak(f"Updated: {name}. Diffusing now.")

        self._session_history.append({
            "timestamp": datetime.now().isoformat(),
            "type": "iterate",
            "modification": modification,
            "formula_name": name,
            "iteration": self._iteration_count,
        })

        plan = self.diffuser.blender.create_plan(formula, intensity=self._current_intensity_name)
        self.diffuser.display_plan(plan)
        if plan.steps:
            self.diffuser.execute(plan)

    def _handle_stronger(self) -> None:
        """Increase diffusing intensity."""
        intensity_levels = list(INTENSITY_PRESETS.keys())
        current_idx = intensity_levels.index(self._current_intensity_name) \
            if self._current_intensity_name in intensity_levels else 2

        if current_idx < len(intensity_levels) - 1:
            self._current_intensity_name = intensity_levels[current_idx + 1]
            self.tts.speak(f"Intensity increased to {self._current_intensity_name}.")
            logger.info("Intensity: %s", self._current_intensity_name)

            # Re-diffuse current formula at new intensity
            if self._current_formula:
                plan = self.diffuser.blender.create_plan(
                    self._current_formula, intensity=self._current_intensity_name
                )
                if plan.steps:
                    self.diffuser.execute(plan)
        else:
            self.tts.speak("Intensity is already at maximum.")

    def _handle_weaker(self) -> None:
        """Decrease diffusing intensity."""
        intensity_levels = list(INTENSITY_PRESETS.keys())
        current_idx = intensity_levels.index(self._current_intensity_name) \
            if self._current_intensity_name in intensity_levels else 2

        if current_idx > 0:
            self._current_intensity_name = intensity_levels[current_idx - 1]
            self.tts.speak(f"Intensity decreased to {self._current_intensity_name}.")
            logger.info("Intensity: %s", self._current_intensity_name)

            if self._current_formula:
                plan = self.diffuser.blender.create_plan(
                    self._current_formula, intensity=self._current_intensity_name
                )
                if plan.steps:
                    self.diffuser.execute(plan)
        else:
            self.tts.speak("Intensity is already at minimum.")

    def _handle_stop(self) -> None:
        """Stop diffusing and clear the air."""
        self.tts.speak("Stopping. Clearing the air.")
        self.diffuser.emergency_stop()
        self.diffuser.clear_air()
        self._current_formula = None
        self._iteration_count = 0

    def _handle_info(self) -> None:
        """Speak information about the currently diffusing scent."""
        info = self.diffuser.get_current_scent_info()
        if info is None and self._current_formula is None:
            self.tts.speak("No scent is currently active.")
            return

        if self._current_formula:
            name = self._current_formula.get("name", "Unknown")
            desc = self._current_formula.get("description", "")
            ingredients = self._current_formula.get("ingredients", [])
            top_3 = sorted(
                [i for i in ingredients if i.get("noteType", i.get("note_type", "")) != "carrier"],
                key=lambda x: -float(x.get("percentage", 0)),
            )[:3]
            top_names = ", ".join(i.get("name", i.get("ingredient", "")) for i in top_3)

            response = f"Currently diffusing: {name}. {desc} Top ingredients: {top_names}. Intensity: {self._current_intensity_name}."
            self.tts.speak(response)

            if RICH_AVAILABLE and console:
                console.print(Panel(
                    f"[bold]{name}[/bold]\n{desc}\nTop: {top_names}\nIntensity: {self._current_intensity_name}",
                    title="[bold]Current Scent[/bold]",
                    border_style="green",
                ))

    def _save_session_history(self) -> None:
        """Save session history to a JSON file."""
        if not self.voice_config.save_history or not self._session_history:
            return

        from voice_config import SESSION_HISTORY_DIR
        history_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), SESSION_HISTORY_DIR)
        os.makedirs(history_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(history_dir, f"session_{timestamp}.json")

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump({
                    "session_start": self._session_history[0]["timestamp"]
                    if self._session_history else "",
                    "session_end": datetime.now().isoformat(),
                    "events": self._session_history,
                }, f, indent=2)
            logger.info("Session history saved to %s", filepath)
        except Exception as exc:
            logger.warning("Could not save session history: %s", exc)

    def _print_banner(self) -> None:
        """Print the startup banner."""
        if RICH_AVAILABLE and console:
            console.print(Panel(
                "[bold]Prompt & Smell -- Voice Controller[/bold]\n\n"
                "Say [cyan]\"Hey Scent\"[/cyan] followed by a scent description.\n"
                "Example: [italic]\"Hey Scent, make it smell like a rainy forest\"[/italic]\n\n"
                "[dim]Follow-up commands:[/dim]\n"
                "  [cyan]\"Make it stronger\"[/cyan] / [cyan]\"Make it weaker\"[/cyan]\n"
                "  [cyan]\"More woody\"[/cyan] / [cyan]\"Less floral\"[/cyan]\n"
                "  [cyan]\"Stop\"[/cyan] / [cyan]\"Clear\"[/cyan]\n"
                "  [cyan]\"What is this?\"[/cyan]\n\n"
                f"Engine: {self.voice_config.speech_engine} | "
                f"Mic: {'ready' if self._mic_available else 'keyboard fallback'} | "
                f"API: {self.voice_config.api_mode} | "
                f"Simulate: {self.simulate}",
                title="[bold bright_cyan]Voice-Activated Scent Control[/bold bright_cyan]",
                border_style="bright_cyan",
            ))
        else:
            print("\n=== Prompt & Smell -- Voice Controller ===")
            print("Say 'Hey Scent' followed by your scent description.")
            print("Commands: stronger, weaker, stop, clear, what is this?")
            print(f"Engine: {self.voice_config.speech_engine}")
            print(f"Microphone: {'ready' if self._mic_available else 'keyboard fallback'}")
            print(f"Simulate: {self.simulate}\n")

    def run(self) -> None:
        """
        Main listening loop. Continuously listens for the wake word, then
        processes commands until the user says "stop" or interrupts.
        """
        self._print_banner()
        self._running = True

        # Calibrate microphone for ambient noise
        if self._mic_available and self._recognizer:
            try:
                if RICH_AVAILABLE and console:
                    console.print("[dim]Calibrating microphone for ambient noise...[/dim]")
                with self._microphone as source:
                    self._recognizer.adjust_for_ambient_noise(source, duration=2)
                logger.info("Ambient noise calibration complete (threshold: %d)",
                            self._recognizer.energy_threshold)
            except Exception as exc:
                logger.warning("Microphone calibration failed: %s", exc)

        self.tts.speak("Voice controller ready. Say Hey Scent to begin.")

        try:
            while self._running:
                # Phase 1: Listen for wake word (or direct command if keyboard)
                text = self._listen_for_speech()

                if text is None:
                    continue

                # Check for wake word
                wake_detected, remainder = self._detect_wake_word(text)

                if not wake_detected:
                    # In keyboard mode, allow commands without wake word
                    if not self._mic_available:
                        wake_detected = True
                        remainder = text
                    else:
                        logger.debug("No wake word detected in: '%s'", text)
                        continue

                if RICH_AVAILABLE and console:
                    console.print(f"[bright_green]Wake word detected![/bright_green]")

                # If there is text after the wake word, process it directly
                if remainder:
                    command_text = remainder
                else:
                    # Phase 2: Listen for the actual command
                    self.tts.speak("I'm listening.")
                    command_text = self._listen_for_speech()
                    if command_text is None:
                        self.tts.speak("I didn't catch that. Please try again.")
                        continue

                # Classify and handle the command
                cmd_type, payload = self._classify_command(command_text)

                if RICH_AVAILABLE and console:
                    console.print(f"[dim]Command: {cmd_type} | Payload: {payload or '(none)'}[/dim]")

                if cmd_type == "generate":
                    self._handle_generate(payload)
                elif cmd_type == "iterate":
                    self._handle_iterate(payload)
                elif cmd_type == "stronger":
                    self._handle_stronger()
                elif cmd_type == "weaker":
                    self._handle_weaker()
                elif cmd_type == "stop":
                    self._handle_stop()
                elif cmd_type == "info":
                    self._handle_info()
                else:
                    self.tts.speak("I did not understand that command. Please try again.")

        except KeyboardInterrupt:
            logger.info("Voice controller interrupted by user")
            if RICH_AVAILABLE and console:
                console.print("\n[yellow]Shutting down...[/yellow]")

        finally:
            self._running = False
            self.diffuser.emergency_stop()
            self.diffuser.cleanup()
            self._save_session_history()
            self.tts.speak("Voice controller shutting down. Goodbye.")
            logger.info("Voice controller stopped")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prompt and Smell -- Voice-Activated Scent Controller",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python voice_controller.py --api-key sk-ant-... --simulate\n"
            "  python voice_controller.py --api-key sk-ant-... --engine whisper\n"
            "  ANTHROPIC_API_KEY=sk-ant-... python voice_controller.py --simulate\n"
        ),
    )

    parser.add_argument(
        "--api-key",
        default=os.environ.get("ANTHROPIC_API_KEY", ""),
        help="Anthropic API key (or set ANTHROPIC_API_KEY env var)",
    )
    parser.add_argument(
        "--engine",
        choices=["google", "whisper", "sphinx"],
        default="google",
        help="Speech recognition engine (default: google)",
    )
    parser.add_argument(
        "--simulate", "-s",
        action="store_true",
        help="Simulation mode: no GPIO control",
    )
    parser.add_argument(
        "--intensity", "-i",
        choices=list(INTENSITY_PRESETS.keys()),
        default=DEFAULT_INTENSITY,
        help=f"Initial intensity (default: {DEFAULT_INTENSITY})",
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Path to custom channel map JSON",
    )
    parser.add_argument(
        "--no-tts",
        action="store_true",
        help="Disable text-to-speech feedback",
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

    if not args.api_key:
        logger.warning(
            "No API key provided. The voice controller will not be able to "
            "generate scents. Pass --api-key or set ANTHROPIC_API_KEY."
        )

    # Load configurations
    voice_cfg = load_voice_config(
        api_key=args.api_key,
        engine=args.engine,
    )
    if args.no_tts:
        voice_cfg.tts_enabled = False

    diffuser_cfg = load_diffuser_config(
        intensity=args.intensity,
        channel_map_path=args.config,
    )

    # Create and run the voice controller
    controller = VoiceController(
        voice_config=voice_cfg,
        diffuser_config=diffuser_cfg,
        simulate=args.simulate,
    )

    controller.run()


if __name__ == "__main__":
    main()
