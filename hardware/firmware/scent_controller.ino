/*
 * Prompt and Smell -- Arduino Mega 2560 Scent Controller Firmware
 * ----------------------------------------------------------------
 * Receives serial commands from the Python host controller and drives
 * 16 peristaltic pumps via MOSFET motor driver boards.
 *
 * Serial protocol (115200 baud, ASCII, newline-terminated):
 *   Command format:  <CMD> [args] *<checksum>\n
 *   Checksum:        XOR of all bytes before the *, as two hex chars
 *   Responses:       OK [data]\n   or   ERR <code> <message>\n
 *
 * Supported commands:
 *   START                        -- Begin dispensing session
 *   PUMP <channel> <duration_ms> -- Run pump on channel 0-15
 *   WAIT <ms>                    -- Pause for ms milliseconds
 *   FLUSH                        -- Run all pumps for 2 seconds
 *   STOP                         -- Emergency stop all pumps
 *   STATUS                       -- Report channel status
 *   CALIBRATE <channel>          -- Steady-state pump for calibration
 *
 * Hardware:
 *   Arduino Mega 2560
 *   16 digital output pins (D22-D37) -> 2x 8-channel MOSFET driver boards
 *   LED on pin 13 blinks during active dispensing
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

#define NUM_CHANNELS       16
#define FIRST_PUMP_PIN     22       // D22 through D37
#define LED_PIN            13
#define SERIAL_BAUD        115200

#define MAX_DURATION_MS    30000UL  // 30 second safety limit per activation
#define FLUSH_DURATION_MS  2000UL   // 2 seconds for flush
#define CALIBRATE_DURATION_MS 10000UL // 10 seconds for calibration run

#define CMD_BUFFER_SIZE    128
#define MAX_ARGS           4

#define LED_BLINK_INTERVAL 250UL    // Blink every 250ms during dispensing

// Error codes
#define ERR_INVALID_COMMAND       "ERR 01 INVALID_COMMAND"
#define ERR_CHECKSUM_FAIL         "ERR 02 CHECKSUM_FAIL"
#define ERR_CHANNEL_OUT_OF_RANGE  "ERR 03 CHANNEL_OUT_OF_RANGE"
#define ERR_INVALID_DURATION      "ERR 04 INVALID_DURATION"

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

// Per-channel tracking
struct ChannelState {
  bool          active;           // Currently running
  unsigned long startTime;        // millis() when activated
  unsigned long duration;         // How long to run (ms)
  unsigned long totalRuntime;     // Cumulative runtime in ms
};

ChannelState channels[NUM_CHANNELS];

// Global state
bool           sessionActive = false;
bool           calibrating   = false;
int            calibrateChannel = -1;
unsigned long  calibrateStart = 0;

// LED blink state
unsigned long  lastLedToggle = 0;
bool           ledState      = false;

// Serial input buffer
char cmdBuffer[CMD_BUFFER_SIZE];
int  cmdIndex = 0;

// ---------------------------------------------------------------------------
// Forward declarations
// ---------------------------------------------------------------------------

void processCommand(const char* raw);
bool verifyChecksum(const char* message, char* payload, int payloadLen);
void parseAndExecute(const char* payload);
void handleStart();
void handlePump(const char* chStr, const char* durStr);
void handleWait(const char* msStr);
void handleFlush();
void handleStop();
void handleStatus();
void handleCalibrate(const char* chStr);
void stopAllPumps();
void activatePump(int channel, unsigned long duration);
void deactivatePump(int channel);
void updatePumps();
void updateLed();
bool anyPumpActive();
int  hexCharToInt(char c);
uint8_t computeChecksum(const char* data, int len);

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial) {
    ; // Wait for serial port to connect (needed for USB)
  }

  // Initialize pump output pins
  for (int i = 0; i < NUM_CHANNELS; i++) {
    int pin = FIRST_PUMP_PIN + i;
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);

    channels[i].active       = false;
    channels[i].startTime    = 0;
    channels[i].duration     = 0;
    channels[i].totalRuntime = 0;
  }

  // LED pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("OK BOOT Prompt&Smell ScentController v1.0");
}

// ---------------------------------------------------------------------------
// Main Loop
// ---------------------------------------------------------------------------

void loop() {
  // Read serial data
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '\n' || c == '\r') {
      if (cmdIndex > 0) {
        cmdBuffer[cmdIndex] = '\0';
        processCommand(cmdBuffer);
        cmdIndex = 0;
      }
    } else {
      if (cmdIndex < CMD_BUFFER_SIZE - 1) {
        cmdBuffer[cmdIndex++] = c;
      } else {
        // Buffer overflow -- discard and reset
        cmdIndex = 0;
        Serial.println(ERR_INVALID_COMMAND);
      }
    }
  }

  // Update pump timers (non-blocking)
  updatePumps();

  // Update calibration
  if (calibrating && calibrateChannel >= 0) {
    unsigned long elapsed = millis() - calibrateStart;
    if (elapsed >= CALIBRATE_DURATION_MS) {
      deactivatePump(calibrateChannel);
      calibrating = false;
      calibrateChannel = -1;
    }
  }

  // Blink LED if any pump is active
  updateLed();
}

// ---------------------------------------------------------------------------
// Command Processing
// ---------------------------------------------------------------------------

void processCommand(const char* raw) {
  int rawLen = strlen(raw);

  // Find the checksum marker '*'
  int starIdx = -1;
  for (int i = rawLen - 1; i >= 0; i--) {
    if (raw[i] == '*') {
      starIdx = i;
      break;
    }
  }

  if (starIdx < 0) {
    // No checksum present -- reject
    Serial.println(ERR_CHECKSUM_FAIL);
    return;
  }

  // Extract payload (everything before the space preceding '*')
  // The format is: "PAYLOAD *XX"
  // Find the payload end -- it is starIdx, but there may be a space before '*'
  int payloadEnd = starIdx;
  if (payloadEnd > 0 && raw[payloadEnd - 1] == ' ') {
    payloadEnd--;
  }

  // Extract checksum hex string (two chars after '*')
  if (rawLen < starIdx + 3) {
    Serial.println(ERR_CHECKSUM_FAIL);
    return;
  }

  char hexHigh = raw[starIdx + 1];
  char hexLow  = raw[starIdx + 2];

  int highNibble = hexCharToInt(hexHigh);
  int lowNibble  = hexCharToInt(hexLow);

  if (highNibble < 0 || lowNibble < 0) {
    Serial.println(ERR_CHECKSUM_FAIL);
    return;
  }

  uint8_t receivedChecksum = (uint8_t)((highNibble << 4) | lowNibble);

  // Compute checksum over the payload portion
  // The Python side computes checksum over "CMD args" (the payload string)
  // which is raw[0..payloadEnd-1]
  uint8_t computed = computeChecksum(raw, payloadEnd);

  if (computed != receivedChecksum) {
    Serial.println(ERR_CHECKSUM_FAIL);
    return;
  }

  // Copy payload into a mutable buffer for parsing
  char payload[CMD_BUFFER_SIZE];
  int pLen = payloadEnd;
  if (pLen >= CMD_BUFFER_SIZE) pLen = CMD_BUFFER_SIZE - 1;
  memcpy(payload, raw, pLen);
  payload[pLen] = '\0';

  parseAndExecute(payload);
}

void parseAndExecute(const char* payload) {
  // Tokenize by spaces
  char buf[CMD_BUFFER_SIZE];
  strncpy(buf, payload, CMD_BUFFER_SIZE - 1);
  buf[CMD_BUFFER_SIZE - 1] = '\0';

  char* args[MAX_ARGS];
  int argCount = 0;

  char* token = strtok(buf, " ");
  while (token != NULL && argCount < MAX_ARGS) {
    args[argCount++] = token;
    token = strtok(NULL, " ");
  }

  if (argCount == 0) {
    Serial.println(ERR_INVALID_COMMAND);
    return;
  }

  const char* cmd = args[0];

  if (strcmp(cmd, "START") == 0) {
    handleStart();
  } else if (strcmp(cmd, "PUMP") == 0) {
    if (argCount < 3) {
      Serial.println(ERR_INVALID_COMMAND);
      return;
    }
    handlePump(args[1], args[2]);
  } else if (strcmp(cmd, "WAIT") == 0) {
    if (argCount < 2) {
      Serial.println(ERR_INVALID_COMMAND);
      return;
    }
    handleWait(args[1]);
  } else if (strcmp(cmd, "FLUSH") == 0) {
    handleFlush();
  } else if (strcmp(cmd, "STOP") == 0) {
    handleStop();
  } else if (strcmp(cmd, "STATUS") == 0) {
    handleStatus();
  } else if (strcmp(cmd, "CALIBRATE") == 0) {
    if (argCount < 2) {
      Serial.println(ERR_INVALID_COMMAND);
      return;
    }
    handleCalibrate(args[1]);
  } else {
    Serial.println(ERR_INVALID_COMMAND);
  }
}

// ---------------------------------------------------------------------------
// Command Handlers
// ---------------------------------------------------------------------------

void handleStart() {
  sessionActive = true;

  // Reset cumulative runtime counters for a new session
  for (int i = 0; i < NUM_CHANNELS; i++) {
    channels[i].totalRuntime = 0;
  }

  Serial.println("OK READY");
}

void handlePump(const char* chStr, const char* durStr) {
  // Parse channel
  long channel = atol(chStr);
  if (channel < 0 || channel >= NUM_CHANNELS) {
    Serial.println(ERR_CHANNEL_OUT_OF_RANGE);
    return;
  }

  // Parse duration
  long duration = atol(durStr);
  if (duration <= 0) {
    Serial.println(ERR_INVALID_DURATION);
    return;
  }
  if ((unsigned long)duration > MAX_DURATION_MS) {
    Serial.println(ERR_INVALID_DURATION);
    return;
  }

  activatePump((int)channel, (unsigned long)duration);

  Serial.print("OK PUMP ");
  Serial.print(channel);
  Serial.print(" ");
  Serial.println(duration);
}

void handleWait(const char* msStr) {
  long waitMs = atol(msStr);
  if (waitMs < 0) {
    Serial.println(ERR_INVALID_DURATION);
    return;
  }
  if (waitMs > (long)MAX_DURATION_MS) {
    Serial.println(ERR_INVALID_DURATION);
    return;
  }

  // Non-blocking wait: we respond immediately after the wait.
  // For short waits this is acceptable since the host serializes commands.
  // We still update pumps during the wait so running pumps are tracked.
  unsigned long waitStart = millis();
  while (millis() - waitStart < (unsigned long)waitMs) {
    updatePumps();
    updateLed();

    // Check for emergency stop during wait
    if (Serial.available() > 0) {
      char peek = Serial.peek();
      // If we see data starting to come in, break out of wait
      // so the main loop can process it (supports STOP during WAIT)
      if (peek == 'S') {
        break;
      }
    }
  }

  Serial.print("OK WAIT ");
  Serial.println(waitMs);
}

void handleFlush() {
  // Activate all pumps for FLUSH_DURATION_MS
  for (int i = 0; i < NUM_CHANNELS; i++) {
    activatePump(i, FLUSH_DURATION_MS);
  }

  // Wait for flush to complete, keeping pump timers updated
  unsigned long flushStart = millis();
  while (millis() - flushStart < FLUSH_DURATION_MS + 100) {
    updatePumps();
    updateLed();

    // Allow emergency stop during flush
    if (Serial.available() > 0) {
      char peek = Serial.peek();
      if (peek == 'S') {
        break;
      }
    }
  }

  Serial.println("OK FLUSH");
}

void handleStop() {
  stopAllPumps();
  sessionActive = false;
  calibrating = false;
  calibrateChannel = -1;

  // Turn off LED
  digitalWrite(LED_PIN, LOW);
  ledState = false;

  Serial.println("OK STOPPED");
}

void handleStatus() {
  // Build a JSON-like status response
  // Format: OK STATUS {active:[0,1,...],runtime:[123,456,...]}
  Serial.print("OK STATUS {\"session\":");
  Serial.print(sessionActive ? "true" : "false");

  Serial.print(",\"active\":[");
  for (int i = 0; i < NUM_CHANNELS; i++) {
    if (i > 0) Serial.print(",");
    Serial.print(channels[i].active ? "1" : "0");
  }

  Serial.print("],\"runtime_ms\":[");
  for (int i = 0; i < NUM_CHANNELS; i++) {
    if (i > 0) Serial.print(",");
    unsigned long rt = channels[i].totalRuntime;
    // If currently active, add elapsed time
    if (channels[i].active) {
      rt += millis() - channels[i].startTime;
    }
    Serial.print(rt);
  }

  Serial.print("],\"calibrating\":");
  Serial.print(calibrating ? "true" : "false");

  if (calibrating && calibrateChannel >= 0) {
    Serial.print(",\"cal_channel\":");
    Serial.print(calibrateChannel);
    unsigned long calElapsed = millis() - calibrateStart;
    Serial.print(",\"cal_elapsed_ms\":");
    Serial.print(calElapsed);
  }

  Serial.println("}");
}

void handleCalibrate(const char* chStr) {
  long channel = atol(chStr);
  if (channel < 0 || channel >= NUM_CHANNELS) {
    Serial.println(ERR_CHANNEL_OUT_OF_RANGE);
    return;
  }

  // Stop any existing calibration
  if (calibrating && calibrateChannel >= 0) {
    deactivatePump(calibrateChannel);
  }

  calibrating = true;
  calibrateChannel = (int)channel;
  calibrateStart = millis();

  // Activate the pump for calibration duration
  activatePump((int)channel, CALIBRATE_DURATION_MS);

  Serial.print("OK CALIBRATE ");
  Serial.println(channel);
}

// ---------------------------------------------------------------------------
// Pump Control
// ---------------------------------------------------------------------------

void activatePump(int channel, unsigned long duration) {
  if (channel < 0 || channel >= NUM_CHANNELS) return;

  int pin = FIRST_PUMP_PIN + channel;
  digitalWrite(pin, HIGH);

  channels[channel].active    = true;
  channels[channel].startTime = millis();
  channels[channel].duration  = duration;
}

void deactivatePump(int channel) {
  if (channel < 0 || channel >= NUM_CHANNELS) return;

  int pin = FIRST_PUMP_PIN + channel;
  digitalWrite(pin, LOW);

  if (channels[channel].active) {
    // Accumulate actual runtime
    unsigned long elapsed = millis() - channels[channel].startTime;
    channels[channel].totalRuntime += elapsed;
  }

  channels[channel].active   = false;
  channels[channel].duration = 0;
}

void stopAllPumps() {
  for (int i = 0; i < NUM_CHANNELS; i++) {
    deactivatePump(i);
  }
}

void updatePumps() {
  unsigned long now = millis();
  for (int i = 0; i < NUM_CHANNELS; i++) {
    if (channels[i].active) {
      unsigned long elapsed = now - channels[i].startTime;
      if (elapsed >= channels[i].duration) {
        deactivatePump(i);
      }
    }
  }
}

bool anyPumpActive() {
  for (int i = 0; i < NUM_CHANNELS; i++) {
    if (channels[i].active) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// LED Control
// ---------------------------------------------------------------------------

void updateLed() {
  if (anyPumpActive() || calibrating) {
    unsigned long now = millis();
    if (now - lastLedToggle >= LED_BLINK_INTERVAL) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      lastLedToggle = now;
    }
  } else {
    if (ledState) {
      ledState = false;
      digitalWrite(LED_PIN, LOW);
    }
  }
}

// ---------------------------------------------------------------------------
// Checksum Utilities
// ---------------------------------------------------------------------------

uint8_t computeChecksum(const char* data, int len) {
  uint8_t xorVal = 0;
  for (int i = 0; i < len; i++) {
    xorVal ^= (uint8_t)data[i];
  }
  return xorVal;
}

int hexCharToInt(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  return -1;
}
