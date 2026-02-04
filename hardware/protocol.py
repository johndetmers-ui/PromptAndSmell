"""
Prompt and Smell -- Serial Communication Protocol
---------------------------------------------------
Defines the command format for communication between the host computer and
the Arduino/Raspberry Pi pump controller.  Includes a command builder, a
response parser, checksum validation, and timeout handling.

Command wire format (ASCII, newline-terminated):
    <CMD> [<args>...] *<checksum>\n

Checksum is a simple XOR of all bytes preceding the asterisk, encoded as
two uppercase hex characters.  The controller echoes back either:
    OK [<data>]\n
    ERR <code> <message>\n

Supported commands:
    START                       -- Begin a dispensing session
    PUMP <channel> <duration_ms> -- Actuate pump on <channel> for <duration_ms>
    WAIT <ms>                   -- Pause between dispenses
    FLUSH                       -- Run all pumps briefly to clear lines
    STOP                        -- Emergency stop / end session
    STATUS                      -- Query controller state
    CALIBRATE <channel>         -- Enter calibration mode for a channel
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List
import time
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

COMMAND_TERMINATOR = "\n"
CHECKSUM_PREFIX = "*"
RESPONSE_OK = "OK"
RESPONSE_ERR = "ERR"
DEFAULT_TIMEOUT_S = 5.0
CALIBRATION_TIMEOUT_S = 60.0


# ---------------------------------------------------------------------------
# Command Types
# ---------------------------------------------------------------------------

class CommandType(str, Enum):
    START = "START"
    PUMP = "PUMP"
    WAIT = "WAIT"
    FLUSH = "FLUSH"
    STOP = "STOP"
    STATUS = "STATUS"
    CALIBRATE = "CALIBRATE"


# ---------------------------------------------------------------------------
# Response Codes
# ---------------------------------------------------------------------------

class ResponseCode(str, Enum):
    OK = "OK"
    ERR_UNKNOWN_CMD = "E01"
    ERR_BAD_ARGS = "E02"
    ERR_CHANNEL_OOB = "E03"
    ERR_DURATION_OOB = "E04"
    ERR_BUSY = "E05"
    ERR_NOT_STARTED = "E06"
    ERR_CHECKSUM = "E07"
    ERR_HARDWARE = "E08"
    ERR_TIMEOUT = "E09"


# ---------------------------------------------------------------------------
# Data Classes
# ---------------------------------------------------------------------------

@dataclass
class Command:
    """A single command to send to the pump controller."""
    command_type: CommandType
    args: List[str]
    raw: str = ""

    def __str__(self) -> str:
        return self.raw or f"{self.command_type.value} {' '.join(self.args)}".strip()


@dataclass
class Response:
    """Parsed response from the pump controller."""
    success: bool
    code: str
    message: str
    data: Optional[str] = None
    raw: str = ""
    latency_ms: float = 0.0


# ---------------------------------------------------------------------------
# Checksum
# ---------------------------------------------------------------------------

def compute_checksum(payload: str) -> str:
    """
    Compute an XOR checksum over every byte in *payload* and return it as
    two uppercase hex characters.
    """
    xor = 0
    for ch in payload:
        xor ^= ord(ch)
    return f"{xor:02X}"


def verify_checksum(message: str) -> bool:
    """
    Verify the checksum appended to *message*.  Returns True if the
    checksum matches or if no checksum is present (for controllers that
    do not echo checksums).
    """
    if CHECKSUM_PREFIX not in message:
        return True  # no checksum to verify
    idx = message.rindex(CHECKSUM_PREFIX)
    payload = message[:idx]
    expected = message[idx + 1:].strip()
    return compute_checksum(payload).upper() == expected.upper()


# ---------------------------------------------------------------------------
# Command Builder
# ---------------------------------------------------------------------------

class CommandBuilder:
    """
    Builds wire-format command strings with proper checksums.
    """

    @staticmethod
    def _build(cmd_type: CommandType, *args: str) -> Command:
        parts = [cmd_type.value] + list(args)
        payload = " ".join(parts)
        checksum = compute_checksum(payload)
        raw = f"{payload} {CHECKSUM_PREFIX}{checksum}{COMMAND_TERMINATOR}"
        return Command(command_type=cmd_type, args=list(args), raw=raw)

    @staticmethod
    def start() -> Command:
        """Build a START command."""
        return CommandBuilder._build(CommandType.START)

    @staticmethod
    def pump(channel: int, duration_ms: int) -> Command:
        """Build a PUMP command."""
        if channel < 0 or channel > 255:
            raise ValueError(f"Channel must be 0-255, got {channel}")
        if duration_ms < 0:
            raise ValueError(f"Duration must be non-negative, got {duration_ms}")
        return CommandBuilder._build(
            CommandType.PUMP, str(channel), str(duration_ms)
        )

    @staticmethod
    def wait(ms: int) -> Command:
        """Build a WAIT command."""
        if ms < 0:
            raise ValueError(f"Wait time must be non-negative, got {ms}")
        return CommandBuilder._build(CommandType.WAIT, str(ms))

    @staticmethod
    def flush() -> Command:
        """Build a FLUSH command."""
        return CommandBuilder._build(CommandType.FLUSH)

    @staticmethod
    def stop() -> Command:
        """Build a STOP command."""
        return CommandBuilder._build(CommandType.STOP)

    @staticmethod
    def status() -> Command:
        """Build a STATUS command."""
        return CommandBuilder._build(CommandType.STATUS)

    @staticmethod
    def calibrate(channel: int) -> Command:
        """Build a CALIBRATE command."""
        if channel < 0 or channel > 255:
            raise ValueError(f"Channel must be 0-255, got {channel}")
        return CommandBuilder._build(CommandType.CALIBRATE, str(channel))


# ---------------------------------------------------------------------------
# Response Parser
# ---------------------------------------------------------------------------

class ResponseParser:
    """
    Parses raw ASCII responses from the pump controller.
    """

    @staticmethod
    def parse(raw: str, start_time: Optional[float] = None) -> Response:
        """
        Parse a raw response string.  Expected formats:
            OK [<data>]
            ERR <code> <message>
        """
        latency = 0.0
        if start_time is not None:
            latency = (time.time() - start_time) * 1000.0

        stripped = raw.strip()
        if not stripped:
            return Response(
                success=False,
                code=ResponseCode.ERR_TIMEOUT.value,
                message="Empty response (possible timeout)",
                raw=raw,
                latency_ms=latency,
            )

        # Verify checksum if present
        if CHECKSUM_PREFIX in stripped:
            if not verify_checksum(stripped):
                return Response(
                    success=False,
                    code=ResponseCode.ERR_CHECKSUM.value,
                    message="Response checksum mismatch",
                    raw=raw,
                    latency_ms=latency,
                )
            # Strip checksum portion for further parsing
            idx = stripped.rindex(CHECKSUM_PREFIX)
            stripped = stripped[:idx].strip()

        if stripped.startswith(RESPONSE_OK):
            data = stripped[len(RESPONSE_OK):].strip() or None
            return Response(
                success=True,
                code=RESPONSE_OK,
                message="Command accepted",
                data=data,
                raw=raw,
                latency_ms=latency,
            )

        if stripped.startswith(RESPONSE_ERR):
            parts = stripped.split(None, 2)
            code = parts[1] if len(parts) > 1 else "E00"
            message = parts[2] if len(parts) > 2 else "Unknown error"
            return Response(
                success=False,
                code=code,
                message=message,
                raw=raw,
                latency_ms=latency,
            )

        # Unexpected format
        return Response(
            success=False,
            code=ResponseCode.ERR_UNKNOWN_CMD.value,
            message=f"Unexpected response format: {stripped}",
            raw=raw,
            latency_ms=latency,
        )


# ---------------------------------------------------------------------------
# Command Sequence Builder
# ---------------------------------------------------------------------------

class CommandSequence:
    """
    Builds an ordered sequence of commands to be sent to the controller.
    Useful for constructing a complete dispensing plan.
    """

    def __init__(self) -> None:
        self._commands: List[Command] = []

    @property
    def commands(self) -> List[Command]:
        return list(self._commands)

    def add_start(self) -> "CommandSequence":
        self._commands.append(CommandBuilder.start())
        return self

    def add_pump(self, channel: int, duration_ms: int) -> "CommandSequence":
        self._commands.append(CommandBuilder.pump(channel, duration_ms))
        return self

    def add_wait(self, ms: int) -> "CommandSequence":
        self._commands.append(CommandBuilder.wait(ms))
        return self

    def add_flush(self) -> "CommandSequence":
        self._commands.append(CommandBuilder.flush())
        return self

    def add_stop(self) -> "CommandSequence":
        self._commands.append(CommandBuilder.stop())
        return self

    def estimated_duration_ms(self) -> int:
        """Estimate the total duration of this sequence in milliseconds."""
        total = 0
        for cmd in self._commands:
            if cmd.command_type == CommandType.PUMP:
                total += int(cmd.args[1])
            elif cmd.command_type == CommandType.WAIT:
                total += int(cmd.args[0])
        return total

    def __len__(self) -> int:
        return len(self._commands)

    def __iter__(self):
        return iter(self._commands)

    def __repr__(self) -> str:
        return f"CommandSequence({len(self._commands)} commands, ~{self.estimated_duration_ms()}ms)"
