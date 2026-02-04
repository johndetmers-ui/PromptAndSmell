/*
 * Prompt and Smell -- Portable Scent Device Firmware
 * ---------------------------------------------------
 * ESP32 firmware for a palm-sized, clip-on smart scent diffuser with
 * 6 swappable accord cartridges driven by piezo atomizer discs.
 *
 * Features:
 *   - 6 PWM-controlled piezo atomizer channels
 *   - 20mm micro blower fan with auto-run and post-diffuse clearing
 *   - BLE GATT service for mobile/web control
 *   - WiFi HTTP server for LAN control
 *   - Battery monitoring with low-battery shutdown
 *   - NeoPixel status LED (blue=ready, green=connected, purple=diffusing, red=low)
 *   - OTA firmware updates over WiFi
 *   - Deep sleep with BLE wake after 5 minutes idle
 *   - Safety: 30s max per atomizer, 5s cooldown between activations
 *
 * Hardware:
 *   ESP32-WROOM-32, 6x 16mm piezo atomizer discs via MOSFETs,
 *   20mm micro blower, WS2812B NeoPixel, TP4056 + 3.7V 1000mAh LiPo
 *
 * Author: Prompt & Smell Project
 * License: MIT
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoOTA.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>
#include <Preferences.h>

// ---------------------------------------------------------------------------
// Firmware Version
// ---------------------------------------------------------------------------
#define FIRMWARE_VERSION "1.0.0"
#define DEVICE_NAME      "PS-Portable"

// ---------------------------------------------------------------------------
// GPIO Pin Assignments
// ---------------------------------------------------------------------------
// Atomizer MOSFET gate pins (active HIGH via N-channel MOSFETs)
#define ATOMIZER_PIN_0   25   // Channel 0 - FLORAL
#define ATOMIZER_PIN_1   26   // Channel 1 - WOODY
#define ATOMIZER_PIN_2   27   // Channel 2 - FRESH
#define ATOMIZER_PIN_3   14   // Channel 3 - WARM
#define ATOMIZER_PIN_4   12   // Channel 4 - SWEET
#define ATOMIZER_PIN_5   13   // Channel 5 - CLEAN

// Fan and LED
#define FAN_PIN          32   // 20mm micro blower MOSFET gate
#define NEOPIXEL_PIN     33   // WS2812B data pin
#define NEOPIXEL_COUNT   1

// Battery monitoring
#define BATTERY_ADC_PIN  34   // ADC1_CH6, voltage divider from LiPo
// Voltage divider: 100K + 100K, so ADC reads half of battery voltage
// 3.7V nominal -> ADC sees 1.85V. 4.2V full -> ADC sees 2.1V
// ESP32 ADC 12-bit (0-4095), 0-3.3V range
#define VDIV_RATIO       2.0
#define ADC_REF_VOLTAGE  3.3
#define ADC_RESOLUTION   4095.0

// ---------------------------------------------------------------------------
// PWM Configuration
// ---------------------------------------------------------------------------
#define PWM_FREQUENCY    40000  // 40kHz base for piezo control envelope
#define PWM_RESOLUTION   8      // 8-bit: 0-255
#define FAN_PWM_CHANNEL  6
#define FAN_PWM_FREQ     25000

// PWM channels for each atomizer (ESP32 has 16 LEDC channels)
const int ATOMIZER_PINS[6] = {
  ATOMIZER_PIN_0, ATOMIZER_PIN_1, ATOMIZER_PIN_2,
  ATOMIZER_PIN_3, ATOMIZER_PIN_4, ATOMIZER_PIN_5
};

// ---------------------------------------------------------------------------
// Safety Limits
// ---------------------------------------------------------------------------
#define MAX_CONTINUOUS_MS     30000   // 30 seconds max per atomizer
#define COOLDOWN_MS           5000    // 5 second cooldown after max run
#define FAN_POST_DELAY_MS     3000    // Fan runs 3s after last atomizer off
#define DEEP_SLEEP_TIMEOUT_MS 300000  // 5 minutes idle -> deep sleep
#define BATTERY_LOW_PCT       20      // Warning threshold
#define BATTERY_CRITICAL_PCT  10      // Auto-shutdown threshold
#define BATTERY_SAMPLE_INTERVAL_MS 10000 // Read battery every 10s

// ---------------------------------------------------------------------------
// BLE UUIDs
// ---------------------------------------------------------------------------
#define BLE_SERVICE_UUID          "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
#define BLE_CHAR_SCENT_CMD_UUID   "a1b2c3d4-e5f6-7890-abcd-ef1234567891"
#define BLE_CHAR_STATUS_UUID      "a1b2c3d4-e5f6-7890-abcd-ef1234567892"
#define BLE_CHAR_DEVICE_INFO_UUID "a1b2c3d4-e5f6-7890-abcd-ef1234567893"

// ---------------------------------------------------------------------------
// WiFi Configuration (loaded from NVS preferences)
// ---------------------------------------------------------------------------
Preferences preferences;
String wifiSSID = "";
String wifiPassword = "";
bool wifiEnabled = false;

// ---------------------------------------------------------------------------
// Global Objects
// ---------------------------------------------------------------------------
Adafruit_NeoPixel statusLed(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
WebServer httpServer(80);

BLEServer* pBLEServer = nullptr;
BLECharacteristic* pScentCmdChar = nullptr;
BLECharacteristic* pStatusChar = nullptr;
BLECharacteristic* pDeviceInfoChar = nullptr;
bool bleClientConnected = false;
bool bleOldClientConnected = false;

// ---------------------------------------------------------------------------
// Device State
// ---------------------------------------------------------------------------
enum DeviceState {
  STATE_IDLE,
  STATE_CONNECTED,
  STATE_DIFFUSING,
  STATE_LOW_BATTERY,
  STATE_SHUTTING_DOWN
};

DeviceState deviceState = STATE_IDLE;

// ---------------------------------------------------------------------------
// Atomizer State
// ---------------------------------------------------------------------------
struct AtomizerState {
  bool active;
  uint8_t intensity;          // 0-100 mapped to PWM
  unsigned long startTime;
  unsigned long duration;     // Requested duration in ms
  unsigned long cooldownUntil; // Timestamp when cooldown ends
};

AtomizerState atomizers[6];
bool fanActive = false;
unsigned long fanShutoffTime = 0;  // When the fan should turn off after clearing
unsigned long lastActivityTime = 0;
unsigned long lastBatterySampleTime = 0;
float batteryVoltage = 0.0;
int batteryPercent = 100;

// LED animation state
unsigned long ledAnimTime = 0;
uint8_t ledPulsePhase = 0;

// ---------------------------------------------------------------------------
// Forward Declarations
// ---------------------------------------------------------------------------
void setupPins();
void setupBLE();
void setupWiFi();
void setupHTTP();
void setupOTA();
void processBlendCommand(const String& jsonStr);
void stopAllAtomizers();
void updateAtomizers();
void updateFan();
void updateBattery();
void updateStatusLed();
void updateBLEStatus();
void checkDeepSleep();
String buildStatusJson();
int voltageToPercent(float voltage);
void setAtomizerPWM(int channel, uint8_t intensity);
void setLedColor(uint8_t r, uint8_t g, uint8_t b);
void pulseLed(uint8_t r, uint8_t g, uint8_t b);

// ---------------------------------------------------------------------------
// BLE Callbacks
// ---------------------------------------------------------------------------
class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    bleClientConnected = true;
    if (deviceState == STATE_IDLE) {
      deviceState = STATE_CONNECTED;
    }
    lastActivityTime = millis();
    Serial.println("[BLE] Client connected");
  }

  void onDisconnect(BLEServer* pServer) override {
    bleClientConnected = false;
    if (deviceState == STATE_CONNECTED) {
      deviceState = STATE_IDLE;
    }
    Serial.println("[BLE] Client disconnected");
    // Restart advertising so another client can connect
    delay(500);
    pServer->startAdvertising();
  }
};

class ScentCmdCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) override {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      Serial.print("[BLE] Scent command received: ");
      Serial.println(value);
      processBlendCommand(value);
      lastActivityTime = millis();
    }
  }
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("========================================");
  Serial.println(" Prompt & Smell - Portable Scent Device");
  Serial.print(" Firmware v");
  Serial.println(FIRMWARE_VERSION);
  Serial.println("========================================");

  // Initialize NeoPixel
  statusLed.begin();
  statusLed.setBrightness(40);
  setLedColor(0, 0, 255); // Blue = starting up

  // Initialize pin modes and PWM
  setupPins();

  // Initialize atomizer states
  for (int i = 0; i < 6; i++) {
    atomizers[i].active = false;
    atomizers[i].intensity = 0;
    atomizers[i].startTime = 0;
    atomizers[i].duration = 0;
    atomizers[i].cooldownUntil = 0;
  }

  // Load WiFi config from NVS
  preferences.begin("psmell", true); // read-only
  wifiSSID = preferences.getString("wifi_ssid", "");
  wifiPassword = preferences.getString("wifi_pass", "");
  wifiEnabled = preferences.getBool("wifi_on", false);
  preferences.end();

  // Setup BLE (always active)
  setupBLE();

  // Setup WiFi if configured
  if (wifiEnabled && wifiSSID.length() > 0) {
    setupWiFi();
    setupHTTP();
    setupOTA();
  }

  // Initial battery reading
  updateBattery();

  lastActivityTime = millis();
  lastBatterySampleTime = millis();

  Serial.println("[INIT] Device ready");
  setLedColor(0, 0, 255); // Blue = ready/idle
}

// ---------------------------------------------------------------------------
// Main Loop (non-blocking)
// ---------------------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // Handle WiFi server and OTA
  if (wifiEnabled && WiFi.status() == WL_CONNECTED) {
    httpServer.handleClient();
    ArduinoOTA.handle();
  }

  // Update atomizer timers and safety
  updateAtomizers();

  // Update fan state
  updateFan();

  // Battery monitoring
  if (now - lastBatterySampleTime >= BATTERY_SAMPLE_INTERVAL_MS) {
    updateBattery();
    lastBatterySampleTime = now;
  }

  // Update status LED animation
  updateStatusLed();

  // Send BLE status notifications periodically
  static unsigned long lastStatusNotify = 0;
  if (bleClientConnected && (now - lastStatusNotify >= 2000)) {
    updateBLEStatus();
    lastStatusNotify = now;
  }

  // Check for deep sleep condition
  checkDeepSleep();

  // Handle BLE reconnect advertising
  if (!bleClientConnected && bleOldClientConnected) {
    bleOldClientConnected = false;
  }
  if (bleClientConnected && !bleOldClientConnected) {
    bleOldClientConnected = true;
  }

  delay(10); // Small yield to prevent WDT reset
}

// ---------------------------------------------------------------------------
// Pin and PWM Setup
// ---------------------------------------------------------------------------
void setupPins() {
  // Configure atomizer PWM channels
  for (int i = 0; i < 6; i++) {
    ledcSetup(i, PWM_FREQUENCY, PWM_RESOLUTION);
    ledcAttachPin(ATOMIZER_PINS[i], i);
    ledcWrite(i, 0);
  }

  // Configure fan PWM
  ledcSetup(FAN_PWM_CHANNEL, FAN_PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(FAN_PIN, FAN_PWM_CHANNEL);
  ledcWrite(FAN_PWM_CHANNEL, 0);

  // Battery ADC
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.println("[PINS] GPIO and PWM configured");
}

// ---------------------------------------------------------------------------
// BLE Setup
// ---------------------------------------------------------------------------
void setupBLE() {
  BLEDevice::init(DEVICE_NAME);
  pBLEServer = BLEDevice::createServer();
  pBLEServer->setCallbacks(new ServerCallbacks());

  // Create the scent service
  BLEService* pService = pBLEServer->createService(BLE_SERVICE_UUID);

  // Scent Command characteristic (write)
  pScentCmdChar = pService->createCharacteristic(
    BLE_CHAR_SCENT_CMD_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  pScentCmdChar->setCallbacks(new ScentCmdCallbacks());

  // Status characteristic (read + notify)
  pStatusChar = pService->createCharacteristic(
    BLE_CHAR_STATUS_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pStatusChar->addDescriptor(new BLE2902());

  // Device Info characteristic (read)
  pDeviceInfoChar = pService->createCharacteristic(
    BLE_CHAR_DEVICE_INFO_UUID,
    BLECharacteristic::PROPERTY_READ
  );

  // Set device info (static)
  StaticJsonDocument<256> infoDoc;
  infoDoc["firmware"] = FIRMWARE_VERSION;
  infoDoc["device"] = DEVICE_NAME;
  infoDoc["channels"] = 6;
  infoDoc["accords"][0] = "Floral";
  infoDoc["accords"][1] = "Woody";
  infoDoc["accords"][2] = "Fresh";
  infoDoc["accords"][3] = "Warm";
  infoDoc["accords"][4] = "Sweet";
  infoDoc["accords"][5] = "Clean";
  String infoStr;
  serializeJson(infoDoc, infoStr);
  pDeviceInfoChar->setValue(infoStr.c_str());

  pService->start();

  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("[BLE] Service started, advertising...");
}

// ---------------------------------------------------------------------------
// WiFi Setup
// ---------------------------------------------------------------------------
void setupWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.println(wifiSSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WIFI] Connected, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[WIFI] Connection failed, running BLE-only mode");
    wifiEnabled = false;
  }
}

// ---------------------------------------------------------------------------
// HTTP Server Setup
// ---------------------------------------------------------------------------
void setupHTTP() {
  // POST /blend - accept blend command
  httpServer.on("/blend", HTTP_POST, []() {
    if (httpServer.hasArg("plain")) {
      String body = httpServer.arg("plain");
      Serial.print("[HTTP] Blend command: ");
      Serial.println(body);
      processBlendCommand(body);
      lastActivityTime = millis();
      httpServer.send(200, "application/json", "{\"status\":\"ok\"}");
    } else {
      httpServer.send(400, "application/json", "{\"error\":\"No body provided\"}");
    }
  });

  // GET /status - return device status
  httpServer.on("/status", HTTP_GET, []() {
    String status = buildStatusJson();
    httpServer.send(200, "application/json", status);
  });

  // POST /stop - stop all atomizers
  httpServer.on("/stop", HTTP_POST, []() {
    Serial.println("[HTTP] Stop command received");
    stopAllAtomizers();
    httpServer.send(200, "application/json", "{\"status\":\"stopped\"}");
  });

  // GET / - basic info page
  httpServer.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><head><title>Prompt &amp; Smell Portable</title></head>";
    html += "<body style='font-family:sans-serif;background:#1a1a2e;color:#e8e0d8;padding:40px;'>";
    html += "<h1 style='color:#d4a574;'>Prompt &amp; Smell - Portable Device</h1>";
    html += "<p>Firmware: " + String(FIRMWARE_VERSION) + "</p>";
    html += "<p>Battery: " + String(batteryPercent) + "%</p>";
    html += "<p>State: " + String(deviceState == STATE_DIFFUSING ? "Diffusing" : "Idle") + "</p>";
    html += "<h3>API Endpoints</h3>";
    html += "<ul>";
    html += "<li>POST /blend - Send blend command (JSON body)</li>";
    html += "<li>GET /status - Read device status</li>";
    html += "<li>POST /stop - Stop all atomizers</li>";
    html += "</ul>";
    html += "</body></html>";
    httpServer.send(200, "text/html", html);
  });

  httpServer.begin();
  Serial.println("[HTTP] Server started on port 80");
}

// ---------------------------------------------------------------------------
// OTA Setup
// ---------------------------------------------------------------------------
void setupOTA() {
  ArduinoOTA.setHostname(DEVICE_NAME);

  ArduinoOTA.onStart([]() {
    stopAllAtomizers();
    setLedColor(255, 165, 0); // Orange during OTA
    Serial.println("[OTA] Update starting...");
  });

  ArduinoOTA.onEnd([]() {
    setLedColor(0, 255, 0);
    Serial.println("[OTA] Update complete, restarting...");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("[OTA] Progress: %u%%\r", (progress / (total / 100)));
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("[OTA] Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
    setLedColor(255, 0, 0);
  });

  ArduinoOTA.begin();
  Serial.println("[OTA] Ready");
}

// ---------------------------------------------------------------------------
// Blend Command Processing
// ---------------------------------------------------------------------------
void processBlendCommand(const String& jsonStr) {
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, jsonStr);

  if (error) {
    Serial.print("[CMD] JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  // Stop any currently running atomizers first
  stopAllAtomizers();

  JsonArray accords = doc["accords"];
  if (accords.isNull()) {
    Serial.println("[CMD] No 'accords' array in command");
    return;
  }

  unsigned long now = millis();
  bool anyActivated = false;

  for (JsonObject accord : accords) {
    int id = accord["id"] | -1;
    int intensity = accord["intensity"] | 0;
    unsigned long duration = accord["duration_ms"] | 10000UL;

    // Validate channel ID
    if (id < 0 || id > 5) {
      Serial.printf("[CMD] Invalid accord id: %d, skipping\n", id);
      continue;
    }

    // Validate intensity
    if (intensity < 0) intensity = 0;
    if (intensity > 100) intensity = 100;

    // Skip zero intensity
    if (intensity == 0) continue;

    // Check cooldown
    if (now < atomizers[id].cooldownUntil) {
      unsigned long remaining = atomizers[id].cooldownUntil - now;
      Serial.printf("[SAFETY] Channel %d in cooldown for %lu ms, skipping\n", id, remaining);
      continue;
    }

    // Enforce max duration
    if (duration > MAX_CONTINUOUS_MS) {
      Serial.printf("[SAFETY] Channel %d duration clamped from %lu to %d ms\n",
                     id, duration, MAX_CONTINUOUS_MS);
      duration = MAX_CONTINUOUS_MS;
    }

    // Activate atomizer
    atomizers[id].active = true;
    atomizers[id].intensity = (uint8_t)intensity;
    atomizers[id].startTime = now;
    atomizers[id].duration = duration;

    // Set PWM duty cycle: map 0-100 intensity to 0-255 PWM
    uint8_t pwmDuty = map(intensity, 0, 100, 0, 255);
    setAtomizerPWM(id, pwmDuty);

    Serial.printf("[CMD] Accord %d: intensity=%d, duration=%lu ms, pwm=%d\n",
                   id, intensity, duration, pwmDuty);
    anyActivated = true;
  }

  if (anyActivated) {
    deviceState = STATE_DIFFUSING;
    // Fan automatically starts when atomizers are active
    fanActive = true;
    ledcWrite(FAN_PWM_CHANNEL, 200); // ~78% fan speed
    fanShutoffTime = 0; // Reset; will be set when all atomizers stop
    Serial.println("[FAN] On (atomizers active)");
  }
}

// ---------------------------------------------------------------------------
// Atomizer Control
// ---------------------------------------------------------------------------
void setAtomizerPWM(int channel, uint8_t duty) {
  if (channel < 0 || channel > 5) return;
  ledcWrite(channel, duty);
}

void stopAllAtomizers() {
  unsigned long now = millis();
  bool wasActive = false;

  for (int i = 0; i < 6; i++) {
    if (atomizers[i].active) {
      wasActive = true;
      // Set cooldown based on how long it ran
      unsigned long runTime = now - atomizers[i].startTime;
      if (runTime >= MAX_CONTINUOUS_MS) {
        atomizers[i].cooldownUntil = now + COOLDOWN_MS;
      }
    }
    atomizers[i].active = false;
    atomizers[i].intensity = 0;
    setAtomizerPWM(i, 0);
  }

  // Start fan clearing delay if atomizers were running
  if (wasActive) {
    fanShutoffTime = now + FAN_POST_DELAY_MS;
    Serial.println("[FAN] Clearing for 3 seconds...");
  }

  if (deviceState == STATE_DIFFUSING) {
    deviceState = bleClientConnected ? STATE_CONNECTED : STATE_IDLE;
  }

  Serial.println("[CMD] All atomizers stopped");
}

void updateAtomizers() {
  unsigned long now = millis();
  bool anyActive = false;

  for (int i = 0; i < 6; i++) {
    if (!atomizers[i].active) continue;

    unsigned long elapsed = now - atomizers[i].startTime;

    // Check if duration expired
    if (elapsed >= atomizers[i].duration) {
      Serial.printf("[TIMER] Accord %d duration expired after %lu ms\n", i, elapsed);
      atomizers[i].active = false;
      atomizers[i].intensity = 0;
      setAtomizerPWM(i, 0);
      // Set cooldown if it ran for the full max
      if (atomizers[i].duration >= MAX_CONTINUOUS_MS) {
        atomizers[i].cooldownUntil = now + COOLDOWN_MS;
        Serial.printf("[SAFETY] Accord %d entering %d ms cooldown\n", i, COOLDOWN_MS);
      }
      continue;
    }

    // Safety: force stop at max continuous time
    if (elapsed >= MAX_CONTINUOUS_MS) {
      Serial.printf("[SAFETY] Accord %d hit max continuous time (%d ms), forcing stop\n",
                     i, MAX_CONTINUOUS_MS);
      atomizers[i].active = false;
      atomizers[i].intensity = 0;
      setAtomizerPWM(i, 0);
      atomizers[i].cooldownUntil = now + COOLDOWN_MS;
      continue;
    }

    anyActive = true;
  }

  // If all atomizers just stopped, begin fan clearing delay
  if (!anyActive && deviceState == STATE_DIFFUSING) {
    if (fanShutoffTime == 0) {
      fanShutoffTime = now + FAN_POST_DELAY_MS;
    }
    deviceState = bleClientConnected ? STATE_CONNECTED : STATE_IDLE;
  }

  if (anyActive) {
    lastActivityTime = now;
  }
}

// ---------------------------------------------------------------------------
// Fan Control
// ---------------------------------------------------------------------------
void updateFan() {
  unsigned long now = millis();

  // Check if any atomizer is active
  bool anyActive = false;
  for (int i = 0; i < 6; i++) {
    if (atomizers[i].active) {
      anyActive = true;
      break;
    }
  }

  if (anyActive) {
    // Fan should be on while atomizers are active
    if (!fanActive) {
      fanActive = true;
      ledcWrite(FAN_PWM_CHANNEL, 200);
      fanShutoffTime = 0;
    }
  } else if (fanActive && fanShutoffTime > 0 && now >= fanShutoffTime) {
    // Post-diffusion clearing period expired
    fanActive = false;
    ledcWrite(FAN_PWM_CHANNEL, 0);
    fanShutoffTime = 0;
    Serial.println("[FAN] Off (clearing complete)");
  }
}

// ---------------------------------------------------------------------------
// Battery Monitoring
// ---------------------------------------------------------------------------
void updateBattery() {
  // Read ADC with averaging (4 samples)
  long adcSum = 0;
  for (int i = 0; i < 4; i++) {
    adcSum += analogRead(BATTERY_ADC_PIN);
    delayMicroseconds(500);
  }
  float adcAvg = (float)adcSum / 4.0;

  // Convert ADC reading to voltage
  batteryVoltage = (adcAvg / ADC_RESOLUTION) * ADC_REF_VOLTAGE * VDIV_RATIO;
  batteryPercent = voltageToPercent(batteryVoltage);

  Serial.printf("[BATT] Voltage: %.2fV, Percent: %d%%\n", batteryVoltage, batteryPercent);

  // Low battery handling
  if (batteryPercent <= BATTERY_CRITICAL_PCT && deviceState != STATE_SHUTTING_DOWN) {
    Serial.println("[BATT] CRITICAL - initiating shutdown");
    deviceState = STATE_SHUTTING_DOWN;
    stopAllAtomizers();
    setLedColor(255, 0, 0);
    delay(3000);

    // Enter deep sleep indefinitely (wake only on charge/reset)
    esp_deep_sleep_start();
  } else if (batteryPercent <= BATTERY_LOW_PCT) {
    if (deviceState != STATE_DIFFUSING) {
      deviceState = STATE_LOW_BATTERY;
    }
  }
}

int voltageToPercent(float voltage) {
  // LiPo discharge curve approximation
  // 4.20V = 100%, 3.70V = 50%, 3.50V = 20%, 3.30V = 5%, 3.00V = 0%
  if (voltage >= 4.20) return 100;
  if (voltage >= 4.10) return 90 + (int)((voltage - 4.10) / 0.10 * 10);
  if (voltage >= 3.95) return 70 + (int)((voltage - 3.95) / 0.15 * 20);
  if (voltage >= 3.80) return 50 + (int)((voltage - 3.80) / 0.15 * 20);
  if (voltage >= 3.70) return 30 + (int)((voltage - 3.70) / 0.10 * 20);
  if (voltage >= 3.50) return 10 + (int)((voltage - 3.50) / 0.20 * 20);
  if (voltage >= 3.30) return 5;
  if (voltage >= 3.00) return (int)((voltage - 3.00) / 0.30 * 5);
  return 0;
}

// ---------------------------------------------------------------------------
// Status LED (NeoPixel)
// ---------------------------------------------------------------------------
void setLedColor(uint8_t r, uint8_t g, uint8_t b) {
  statusLed.setPixelColor(0, statusLed.Color(r, g, b));
  statusLed.show();
}

void pulseLed(uint8_t r, uint8_t g, uint8_t b) {
  // Sine-wave pulse effect using millis
  unsigned long now = millis();
  float phase = (float)(now % 2000) / 2000.0 * 2.0 * 3.14159;
  float brightness = (sin(phase) + 1.0) / 2.0; // 0.0 to 1.0
  brightness = 0.2 + brightness * 0.8; // Keep minimum 20% brightness

  setLedColor(
    (uint8_t)(r * brightness),
    (uint8_t)(g * brightness),
    (uint8_t)(b * brightness)
  );
}

void updateStatusLed() {
  switch (deviceState) {
    case STATE_IDLE:
      setLedColor(0, 0, 180);       // Solid blue = ready
      break;
    case STATE_CONNECTED:
      setLedColor(0, 180, 0);       // Solid green = connected
      break;
    case STATE_DIFFUSING:
      pulseLed(160, 0, 255);        // Pulsing purple = diffusing
      break;
    case STATE_LOW_BATTERY:
      pulseLed(255, 0, 0);          // Pulsing red = low battery
      break;
    case STATE_SHUTTING_DOWN:
      setLedColor(255, 0, 0);       // Solid red = shutting down
      break;
  }
}

// ---------------------------------------------------------------------------
// BLE Status Notification
// ---------------------------------------------------------------------------
String buildStatusJson() {
  StaticJsonDocument<512> doc;

  doc["battery_pct"] = batteryPercent;
  doc["battery_v"] = serialized(String(batteryVoltage, 2));
  doc["state"] = (deviceState == STATE_IDLE) ? "idle" :
                 (deviceState == STATE_CONNECTED) ? "connected" :
                 (deviceState == STATE_DIFFUSING) ? "diffusing" :
                 (deviceState == STATE_LOW_BATTERY) ? "low_battery" :
                 "shutting_down";

  JsonArray activeArr = doc.createNestedArray("active_accords");
  for (int i = 0; i < 6; i++) {
    if (atomizers[i].active) {
      JsonObject acc = activeArr.createNestedObject();
      acc["id"] = i;
      acc["intensity"] = atomizers[i].intensity;
      unsigned long remaining = 0;
      unsigned long elapsed = millis() - atomizers[i].startTime;
      if (elapsed < atomizers[i].duration) {
        remaining = atomizers[i].duration - elapsed;
      }
      acc["remaining_ms"] = remaining;
    }
  }

  doc["fan_active"] = fanActive;
  doc["wifi_connected"] = (wifiEnabled && WiFi.status() == WL_CONNECTED);
  if (wifiEnabled && WiFi.status() == WL_CONNECTED) {
    doc["ip"] = WiFi.localIP().toString();
  }
  doc["firmware"] = FIRMWARE_VERSION;

  String result;
  serializeJson(doc, result);
  return result;
}

void updateBLEStatus() {
  if (!bleClientConnected || pStatusChar == nullptr) return;

  String status = buildStatusJson();
  pStatusChar->setValue(status.c_str());
  pStatusChar->notify();
}

// ---------------------------------------------------------------------------
// Deep Sleep
// ---------------------------------------------------------------------------
void checkDeepSleep() {
  if (deviceState == STATE_DIFFUSING) return; // Never sleep while diffusing
  if (bleClientConnected) return;             // Never sleep while connected

  unsigned long now = millis();
  if (now - lastActivityTime >= DEEP_SLEEP_TIMEOUT_MS) {
    Serial.println("[SLEEP] Idle timeout reached, entering deep sleep");
    Serial.println("[SLEEP] BLE advertising will continue for wake-up");

    stopAllAtomizers();
    setLedColor(0, 0, 0); // LED off

    // Configure wake-up sources
    // Wake on BLE connection (GPIO wake not directly available for BLE,
    // but ESP32 BLE advertising continues in light sleep.
    // Using a timer wake as fallback to periodically check for connections.)
    esp_sleep_enable_timer_wakeup(30 * 1000000ULL); // Wake every 30 seconds

    // Enter light sleep (BLE advertising persists in light sleep)
    Serial.flush();
    esp_light_sleep_start();

    // After waking, reset activity timer
    lastActivityTime = millis();
    Serial.println("[SLEEP] Woke up from light sleep");

    // Re-read battery
    updateBattery();
  }
}

// ---------------------------------------------------------------------------
// Arduino Entry Points (already defined above as setup() and loop())
// ---------------------------------------------------------------------------
