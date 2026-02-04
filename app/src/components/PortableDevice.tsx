// PortableDevice.tsx -- Web Bluetooth controller for the Prompt & Smell
// portable scent device. This component should be added to the /create page
// alongside the DispenseButton component.
//
// Uses the Web Bluetooth API (navigator.bluetooth) to connect to the
// ESP32-based portable device via BLE, map the current formula to 6 accord
// channels, and send diffusion commands.
//
// Browser compatibility: Web Bluetooth is supported in Chrome and Edge only.
// Safari and Firefox do not support Web Bluetooth.

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OSCFormula, ScentCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// BLE Constants (must match ESP32 firmware)
// ---------------------------------------------------------------------------

const BLE_SERVICE_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const BLE_CHAR_SCENT_CMD_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567891";
const BLE_CHAR_STATUS_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567892";
const BLE_CHAR_DEVICE_INFO_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567893";

const DEVICE_NAME_PREFIX = "PS-Portable";

// ---------------------------------------------------------------------------
// Accord Definitions
// ---------------------------------------------------------------------------

interface AccordDef {
  id: number;
  name: string;
  colorHex: string;
  categories: ScentCategory[];
}

const ACCORD_DEFS: AccordDef[] = [
  {
    id: 0,
    name: "Floral",
    colorHex: "#E91E90",
    categories: ["floral", "powdery"],
  },
  {
    id: 1,
    name: "Woody",
    colorHex: "#8B6914",
    categories: ["woody", "earthy", "smoky"],
  },
  {
    id: 2,
    name: "Fresh",
    colorHex: "#00CED1",
    categories: ["citrus", "green", "aquatic", "aromatic"],
  },
  {
    id: 3,
    name: "Warm",
    colorHex: "#FF8C00",
    categories: ["oriental", "amber", "spicy"],
  },
  {
    id: 4,
    name: "Sweet",
    colorHex: "#FF69B4",
    categories: ["gourmand", "fruity"],
  },
  {
    id: 5,
    name: "Clean",
    colorHex: "#87CEEB",
    categories: ["musk", "fresh", "herbal"],
  },
];

// Fallback categories not directly in the list above
const CATEGORY_FALLBACKS: Record<string, number> = {
  leather: 1,
  animalic: 1,
  balsamic: 3,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccordIntensity {
  id: number;
  name: string;
  colorHex: string;
  rawPercentage: number;
  intensity: number; // 0-100
}

interface DeviceStatus {
  battery_pct: number;
  battery_v: string;
  state: string;
  fan_active: boolean;
  wifi_connected: boolean;
  active_accords: { id: number; intensity: number; remaining_ms: number }[];
  firmware: string;
}

interface DeviceInfo {
  firmware: string;
  device: string;
  channels: number;
  accords: string[];
}

type ConnectionState =
  | "disconnected"
  | "checking"
  | "scanning"
  | "connected"
  | "diffusing";

interface PortableDeviceProps {
  formula: OSCFormula;
}

// ---------------------------------------------------------------------------
// Duration options
// ---------------------------------------------------------------------------

const DURATION_OPTIONS = [
  { label: "10s", value: 10 },
  { label: "30s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "Continuous", value: 0 },
];

// ---------------------------------------------------------------------------
// Accord Mapping Logic
// ---------------------------------------------------------------------------

function mapFormulaToAccords(formula: OSCFormula): AccordIntensity[] {
  const channelPcts: Record<number, number> = {};
  for (let i = 0; i < 6; i++) channelPcts[i] = 0;

  for (const ingredient of formula.ingredients) {
    const cat = ingredient.category.toLowerCase().trim();
    if (cat === "carrier" || cat === "solvent") continue;

    let accordId = -1;

    // Check each accord definition
    for (const def of ACCORD_DEFS) {
      if ((def.categories as string[]).includes(cat)) {
        accordId = def.id;
        break;
      }
    }

    // Check fallbacks
    if (accordId === -1) {
      accordId = CATEGORY_FALLBACKS[cat] ?? 5; // Default to Clean
    }

    channelPcts[accordId] += ingredient.percentage;
  }

  // Find the max for normalization
  const maxPct = Math.max(...Object.values(channelPcts), 0.001);

  return ACCORD_DEFS.map((def) => {
    const rawPct = channelPcts[def.id] || 0;
    const intensity = Math.round((rawPct / maxPct) * 100);
    return {
      id: def.id,
      name: def.name,
      colorHex: def.colorHex,
      rawPercentage: Math.round(rawPct * 100) / 100,
      intensity,
    };
  });
}

// ---------------------------------------------------------------------------
// Web Bluetooth availability check
// ---------------------------------------------------------------------------

function isWebBluetoothSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    typeof navigator.bluetooth?.requestDevice === "function"
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PortableDevice({ formula }: PortableDeviceProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("checking");
  const [browserSupported, setBrowserSupported] = useState(true);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [scentCmdChar, setScentCmdChar] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [statusChar, setStatusChar] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [accordBlend, setAccordBlend] = useState<AccordIntensity[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const supported = isWebBluetoothSupported();
    setBrowserSupported(supported);
    setConnectionState(supported ? "disconnected" : "checking");
  }, []);

  // Map formula to accords whenever formula changes
  useEffect(() => {
    if (formula && formula.ingredients) {
      setAccordBlend(mapFormulaToAccords(formula));
    }
  }, [formula]);

  // Handle device disconnection
  const handleDisconnect = useCallback(() => {
    setConnectionState("disconnected");
    setServer(null);
    setScentCmdChar(null);
    setStatusChar(null);
    setDeviceStatus(null);

    // Attempt auto-reconnect after 3 seconds
    if (device) {
      reconnectTimeoutRef.current = setTimeout(() => {
        connectToDevice(device);
      }, 3000);
    }
  }, [device]);

  // Clean up reconnect timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Connect to a specific device
  const connectToDevice = async (bleDevice: BluetoothDevice) => {
    try {
      setError(null);
      setConnectionState("scanning");

      bleDevice.addEventListener(
        "gattserverdisconnected",
        handleDisconnect
      );

      const gattServer = await bleDevice.gatt?.connect();
      if (!gattServer) {
        throw new Error("Failed to connect to GATT server");
      }
      setServer(gattServer);

      // Get the scent service
      const service = await gattServer.getPrimaryService(BLE_SERVICE_UUID);

      // Get characteristics
      const cmdChar = await service.getCharacteristic(
        BLE_CHAR_SCENT_CMD_UUID
      );
      setScentCmdChar(cmdChar);

      const statChar = await service.getCharacteristic(
        BLE_CHAR_STATUS_UUID
      );
      setStatusChar(statChar);

      // Read device info
      try {
        const infoChar = await service.getCharacteristic(
          BLE_CHAR_DEVICE_INFO_UUID
        );
        const infoValue = await infoChar.readValue();
        const infoText = new TextDecoder().decode(infoValue);
        setDeviceInfo(JSON.parse(infoText));
      } catch {
        // Device info is optional
      }

      // Subscribe to status notifications
      try {
        await statChar.startNotifications();
        statChar.addEventListener(
          "characteristicvaluechanged",
          (event: Event) => {
            const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
            const value = target.value;
            if (value) {
              const text = new TextDecoder().decode(value);
              try {
                const status = JSON.parse(text) as DeviceStatus;
                setDeviceStatus(status);
                // Update connection state based on device state
                if (status.state === "diffusing") {
                  setConnectionState("diffusing");
                } else if (connectionState === "diffusing") {
                  setConnectionState("connected");
                }
              } catch {
                // Ignore malformed status
              }
            }
          }
        );
      } catch {
        // Notifications are optional
      }

      // Read initial status
      try {
        const statusValue = await statChar.readValue();
        const statusText = new TextDecoder().decode(statusValue);
        setDeviceStatus(JSON.parse(statusText));
      } catch {
        // Initial status read is optional
      }

      setConnectionState("connected");
    } catch (exc) {
      const message =
        exc instanceof Error ? exc.message : "Unknown connection error";
      setError(message);
      setConnectionState("disconnected");
    }
  };

  // Scan and connect
  const handleConnect = async () => {
    if (!isWebBluetoothSupported()) return;
    setError(null);
    setConnectionState("scanning");

    try {
      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: DEVICE_NAME_PREFIX }],
        optionalServices: [BLE_SERVICE_UUID],
      });

      setDevice(bleDevice);
      await connectToDevice(bleDevice);
    } catch (exc) {
      const message =
        exc instanceof Error ? exc.message : "Scan cancelled or failed";
      if (!message.includes("cancelled")) {
        setError(message);
      }
      setConnectionState("disconnected");
    }
  };

  // Send blend to device
  const handleSendBlend = async () => {
    if (!scentCmdChar) return;
    setError(null);

    const durationMs =
      selectedDuration === 0 ? 30000 : selectedDuration * 1000;
    const accords = accordBlend
      .filter((a) => a.intensity > 0)
      .map((a) => ({
        id: a.id,
        intensity: a.intensity,
        duration_ms: durationMs,
      }));

    const command = JSON.stringify({ accords });
    const encoder = new TextEncoder();

    try {
      await scentCmdChar.writeValue(encoder.encode(command));
      setConnectionState("diffusing");
    } catch (exc) {
      const message =
        exc instanceof Error ? exc.message : "Failed to send command";
      setError(message);
    }
  };

  // Stop all atomizers
  const handleStop = async () => {
    if (!scentCmdChar) return;

    const stopCmd = JSON.stringify({
      accords: [0, 1, 2, 3, 4, 5].map((id) => ({
        id,
        intensity: 0,
        duration_ms: 0,
      })),
    });

    try {
      await scentCmdChar.writeValue(new TextEncoder().encode(stopCmd));
      setConnectionState("connected");
    } catch {
      // Best effort
    }
  };

  // Disconnect
  const handleDisconnectClick = async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setServer(null);
    setScentCmdChar(null);
    setStatusChar(null);
    setDeviceInfo(null);
    setDeviceStatus(null);
    setConnectionState("disconnected");
  };

  // Battery icon helper
  const batteryIcon = (pct: number) => {
    if (pct > 75) return "||||";
    if (pct > 50) return "|||.";
    if (pct > 25) return "||..";
    if (pct > 10) return "|...";
    return "!...";
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!browserSupported) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">
          Portable Device
        </h3>
        <p className="text-gray-400 text-sm">
          Web Bluetooth is not supported in this browser. Please use Chrome or
          Edge to connect to the portable scent device.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="glass rounded-xl p-6 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-200">
          Portable Device
        </h3>
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === "connected"
                ? "bg-green-400"
                : connectionState === "diffusing"
                  ? "bg-purple-400 animate-pulse"
                  : connectionState === "scanning"
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-gray-500"
            }`}
          />
          <span className="text-xs text-gray-400 capitalize">
            {connectionState}
          </span>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnected state */}
      {connectionState === "disconnected" && (
        <motion.button
          className="w-full btn-secondary flex items-center justify-center gap-2"
          onClick={handleConnect}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Connect Device
        </motion.button>
      )}

      {/* Scanning state */}
      {connectionState === "scanning" && (
        <div className="flex items-center justify-center gap-3 py-4">
          <motion.div
            className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <span className="text-gray-400 text-sm">
            Scanning for devices...
          </span>
        </div>
      )}

      {/* Connected / Diffusing states */}
      {(connectionState === "connected" ||
        connectionState === "diffusing") && (
        <>
          {/* Device Status Card */}
          {deviceStatus && (
            <motion.div
              className="bg-surface-800/50 rounded-lg p-4 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Battery indicator */}
                  <div
                    className={`font-mono text-xs px-2 py-1 rounded ${
                      deviceStatus.battery_pct > 20
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    [{batteryIcon(deviceStatus.battery_pct)}]{" "}
                    {deviceStatus.battery_pct}%
                  </div>
                  <span className="text-xs text-gray-500">
                    {deviceStatus.battery_v}V
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  FW {deviceInfo?.firmware || deviceStatus.firmware || "?"}
                </span>
              </div>

              {deviceStatus.fan_active && (
                <div className="text-xs text-gray-400">
                  Fan active
                </div>
              )}
            </motion.div>
          )}

          {/* Accord Preview Bars */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Accord Mapping
            </h4>
            {accordBlend.map((accord, i) => (
              <motion.div
                key={accord.id}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-xs text-gray-400 w-14 text-right">
                  {accord.name}
                </span>
                <div className="flex-1 h-3 bg-surface-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: accord.colorHex }}
                    initial={{ width: 0 }}
                    animate={{ width: `${accord.intensity}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right font-mono">
                  {accord.intensity}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Duration
            </h4>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDuration === opt.value
                      ? "bg-primary-400/20 text-primary-300 border border-primary-400/40"
                      : "glass text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setSelectedDuration(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {connectionState === "diffusing" ? (
              <motion.button
                className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-all"
                onClick={handleStop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Stop
              </motion.button>
            ) : (
              <motion.button
                className="flex-1 btn-primary"
                onClick={handleSendBlend}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send to Device
              </motion.button>
            )}
            <motion.button
              className="px-4 py-3 glass rounded-lg text-gray-400 hover:text-gray-200 transition-all"
              onClick={handleDisconnectClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Disconnect"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </motion.button>
          </div>
        </>
      )}

      {/* Footer note */}
      <p className="text-xs text-gray-600 text-center">
        Requires Chrome or Edge with Web Bluetooth
      </p>
    </motion.div>
  );
}
