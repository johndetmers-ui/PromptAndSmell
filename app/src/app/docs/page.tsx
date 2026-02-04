"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileCode2, Server, Cpu, Copy, Check } from "lucide-react";

type DocTab = "osc" | "api" | "hardware";

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md glass opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Copy code"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      <pre className="bg-surface-900 border border-surface-600/30 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function OSCSpec() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-200 mb-3">
          Open Scent Code (OSC) Specification
        </h2>
        <p className="text-gray-400 leading-relaxed">
          The Open Scent Code is a JSON-based format for describing fragrance
          formulas in a machine-readable, standardized way. It enables
          interoperability between AI scent generators, digital scent
          dispensers, and fragrance creation tools.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Format Overview
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          An OSC file is a JSON document containing the following top-level
          fields. All percentages in the ingredients array must sum to
          exactly 100.
        </p>
        <CodeBlock
          code={`{
  "osc_version": "1.0.0",
  "id": "unique-scent-identifier",
  "name": "Scent Name",
  "description": "Human-readable description",
  "prompt": "The original natural language prompt",
  "creator": "Creator name or ID",
  "created_at": "2025-01-15T10:30:00Z",

  "ingredients": [
    {
      "name": "Bergamot",
      "cas_number": "8007-75-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 15.0,
      "intensity": 6
    }
  ],

  "evolution": {
    "opening": ["Bergamot", "Lemon"],
    "heart": ["Rose", "Jasmine"],
    "drydown": ["Sandalwood", "Musk"]
  },

  "accords": [
    {
      "name": "Floral Bouquet",
      "strength": 75,
      "ingredients": ["Rose", "Jasmine"]
    }
  ],

  "metadata": {
    "intensity": 7,
    "longevity_hours": 8,
    "sillage": "moderate",
    "mood": ["Romantic", "Warm"],
    "season": ["Spring", "Summer"]
  },

  "safety": {
    "ifra_compliance": true,
    "allergens": ["Linalool", "Geraniol"],
    "max_skin_concentration": 15,
    "notes": "Patch test recommended"
  }
}`}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Field Reference
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600/30">
                <th className="text-left py-2 pr-4 text-gray-400 font-medium">
                  Field
                </th>
                <th className="text-left py-2 pr-4 text-gray-400 font-medium">
                  Type
                </th>
                <th className="text-left py-2 pr-4 text-gray-400 font-medium">
                  Required
                </th>
                <th className="text-left py-2 text-gray-400 font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                ["osc_version", "string", "Yes", "Semver version of the OSC format"],
                ["id", "string", "Yes", "Unique identifier for the formula"],
                ["name", "string", "Yes", "Human-readable name"],
                ["description", "string", "No", "Longer description of the scent"],
                ["prompt", "string", "No", "Original NLP prompt used to generate"],
                ["ingredients", "array", "Yes", "Array of ingredient objects"],
                ["ingredients[].name", "string", "Yes", "Common ingredient name"],
                ["ingredients[].cas_number", "string", "Yes", "CAS registry number"],
                ["ingredients[].category", "string", "Yes", "One of: citrus, floral, woody, fresh, oriental, musk, green, fruity, spicy, aquatic, gourmand, leather, aromatic, amber, powdery, earthy, smoky, herbal, animalic, balsamic"],
                ["ingredients[].note_type", "string", "Yes", "One of: top, middle, base"],
                ["ingredients[].percentage", "number", "Yes", "0-100, all must sum to 100"],
                ["ingredients[].intensity", "number", "Yes", "1-10 subjective intensity"],
                ["evolution", "object", "No", "Scent development over time"],
                ["accords", "array", "No", "Detected harmony groups"],
                ["safety", "object", "Yes", "IFRA compliance and allergen info"],
              ].map(([field, type, req, desc]) => (
                <tr key={field} className="border-b border-surface-700/20">
                  <td className="py-2 pr-4 font-mono text-xs text-primary-400">
                    {field}
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {type}
                  </td>
                  <td className="py-2 pr-4 text-xs">{req}</td>
                  <td className="py-2 text-xs text-gray-400">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Scent Categories
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          The OSC format defines 20 standardized scent categories. Each
          ingredient must belong to exactly one category.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            "citrus", "floral", "woody", "fresh", "oriental", "musk",
            "green", "fruity", "spicy", "aquatic", "gourmand", "leather",
            "aromatic", "amber", "powdery", "earthy", "smoky", "herbal",
            "animalic", "balsamic",
          ].map((cat) => (
            <div
              key={cat}
              className="text-xs px-3 py-2 rounded-lg bg-surface-800/50 text-gray-400 capitalize border border-surface-600/20"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Validation Rules
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="text-primary-400">1.</span>
            All ingredient percentages must sum to exactly 100.0
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400">2.</span>
            Each ingredient percentage must be between 0.1 and 99.9
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400">3.</span>
            Intensity values must be integers between 1 and 10
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400">4.</span>
            CAS numbers should follow the format: digits-digits-digit
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400">5.</span>
            The evolution object ingredient names must reference ingredients in the formula
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400">6.</span>
            Sillage must be one of: intimate, moderate, strong, enormous
          </li>
        </ul>
      </div>
    </div>
  );
}

function APIReference() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-200 mb-3">
          API Reference
        </h2>
        <p className="text-gray-400 leading-relaxed">
          The Prompt & Smell API allows you to programmatically generate
          scent formulas, iterate on existing formulas, and manage your
          scent library.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Base URL
        </h3>
        <CodeBlock code="https://api.promptandsmell.com/v1" language="text" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Authentication
        </h3>
        <p className="text-gray-400 text-sm mb-3">
          All API requests require a Bearer token in the Authorization header.
        </p>
        <CodeBlock
          code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.promptandsmell.com/v1/generate`}
          language="bash"
        />
      </div>

      {/* POST /generate */}
      <div className="card border-l-2 border-l-green-500/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-green-500/20 text-green-400">
            POST
          </span>
          <span className="font-mono text-sm text-gray-200">/generate</span>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Generate a new scent formula from a natural language prompt.
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Request Body
            </h4>
            <CodeBlock
              code={`{
  "prompt": "A rainy forest at dawn",
  "preferences": {
    "intensity": 7,
    "longevity": 8,
    "style": "natural"
  }
}`}
            />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Response (200 OK)
            </h4>
            <CodeBlock
              code={`{
  "formula": {
    "id": "scent-abc123",
    "name": "Dawn Petrichor",
    "osc_version": "1.0.0",
    "ingredients": [...],
    "evolution": {...},
    "accords": [...]
  },
  "suggestions": [
    "Try adding more moss for depth",
    "Consider reducing citrus for a moodier feel"
  ],
  "processing_time_ms": 1247
}`}
            />
          </div>
        </div>
      </div>

      {/* POST /iterate */}
      <div className="card border-l-2 border-l-blue-500/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-blue-500/20 text-blue-400">
            POST
          </span>
          <span className="font-mono text-sm text-gray-200">/iterate</span>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Modify an existing formula with a natural language instruction.
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Request Body
            </h4>
            <CodeBlock
              code={`{
  "formula_id": "scent-abc123",
  "modification": "Make it smokier and less floral",
  "current_formula": {
    "id": "scent-abc123",
    "ingredients": [...]
  }
}`}
            />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Response (200 OK)
            </h4>
            <CodeBlock
              code={`{
  "formula": {
    "id": "scent-def456",
    "ingredients": [...]
  },
  "changes": {
    "added": ["Birch Tar", "Cade"],
    "removed": ["Jasmine"],
    "adjusted": [
      {
        "name": "Rose",
        "old_pct": 15.0,
        "new_pct": 8.0
      }
    ]
  },
  "suggestions": [
    "The smokiness pairs well with leather notes",
    "Consider adding vetiver for grounding"
  ]
}`}
            />
          </div>
        </div>
      </div>

      {/* GET /scent/:id */}
      <div className="card border-l-2 border-l-purple-500/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-purple-500/20 text-purple-400">
            GET
          </span>
          <span className="font-mono text-sm text-gray-200">
            /scent/:id
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Retrieve a specific scent formula by ID.
        </p>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Response (200 OK)
          </h4>
          <CodeBlock
            code={`{
  "formula": {
    "id": "scent-abc123",
    "name": "Dawn Petrichor",
    "osc_version": "1.0.0",
    "ingredients": [...],
    "evolution": {...},
    "accords": [...],
    "safety": {...}
  },
  "stats": {
    "likes": 247,
    "remixes": 12,
    "views": 1893
  }
}`}
          />
        </div>
      </div>

      {/* Rate limits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Rate Limits
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600/30">
                <th className="text-left py-2 pr-4 text-gray-400">Plan</th>
                <th className="text-left py-2 pr-4 text-gray-400">
                  Generations/day
                </th>
                <th className="text-left py-2 pr-4 text-gray-400">
                  Iterations/day
                </th>
                <th className="text-left py-2 text-gray-400">
                  Requests/min
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-surface-700/20">
                <td className="py-2 pr-4">Free</td>
                <td className="py-2 pr-4">10</td>
                <td className="py-2 pr-4">50</td>
                <td className="py-2">5</td>
              </tr>
              <tr className="border-b border-surface-700/20">
                <td className="py-2 pr-4">Pro</td>
                <td className="py-2 pr-4">100</td>
                <td className="py-2 pr-4">500</td>
                <td className="py-2">30</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Enterprise</td>
                <td className="py-2 pr-4">Unlimited</td>
                <td className="py-2 pr-4">Unlimited</td>
                <td className="py-2">100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HardwareGuide() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-200 mb-3">
          Hardware Guide
        </h2>
        <p className="text-gray-400 leading-relaxed">
          Learn how to set up and configure a compatible scent dispensing
          device to bring your digital formulas into the physical world.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Compatible Devices
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Prompt & Smell works with any device that accepts OSC format
          inputs. Currently supported hardware:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              name: "Scent Dispenser Pro X1",
              channels: 16,
              connection: "USB-C / WiFi",
              status: "Fully Supported",
            },
            {
              name: "AromaNode Mini",
              channels: 8,
              connection: "Bluetooth",
              status: "Fully Supported",
            },
            {
              name: "OlfactoryLab Bench Unit",
              channels: 32,
              connection: "Ethernet",
              status: "Beta Support",
            },
            {
              name: "DIY Arduino Shield v2",
              channels: 6,
              connection: "USB Serial",
              status: "Community Supported",
            },
          ].map((device) => (
            <div key={device.name} className="card">
              <h4 className="font-semibold text-gray-200 text-sm mb-2">
                {device.name}
              </h4>
              <div className="space-y-1 text-xs text-gray-400">
                <p>Channels: {device.channels}</p>
                <p>Connection: {device.connection}</p>
                <p>
                  Status:{" "}
                  <span className="text-green-400">{device.status}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Quick Start Setup
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-primary-400 mb-2">
              Step 1: Install the CLI Tool
            </h4>
            <CodeBlock code="npm install -g @promptandsmell/cli" language="bash" />
          </div>

          <div>
            <h4 className="text-sm font-medium text-primary-400 mb-2">
              Step 2: Connect Your Device
            </h4>
            <CodeBlock
              code={`# Scan for available devices
pns devices scan

# Connect to a specific device
pns devices connect --id "DEVICE_SERIAL_NUMBER"

# Verify connection
pns devices status`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-primary-400 mb-2">
              Step 3: Calibrate Cartridges
            </h4>
            <CodeBlock
              code={`# Run the calibration wizard
pns calibrate --interactive

# Or manually set cartridge mapping
pns cartridge set --slot 1 --ingredient "Bergamot" --fill 95
pns cartridge set --slot 2 --ingredient "Rose" --fill 88
pns cartridge set --slot 3 --ingredient "Sandalwood" --fill 92`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-primary-400 mb-2">
              Step 4: Dispense a Scent
            </h4>
            <CodeBlock
              code={`# Dispense from an OSC file
pns dispense --file my-scent.osc.json

# Dispense from the API directly
pns dispense --scent-id "scent-abc123"

# Dispense with custom volume (in mL)
pns dispense --file my-scent.osc.json --volume 2.0`}
              language="bash"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Hardware Configuration File
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          The device configuration is stored as JSON and can be edited
          manually or through the CLI.
        </p>
        <CodeBlock
          code={`{
  "device_id": "PNS-X1-001234",
  "firmware_version": "2.4.1",
  "channels": 16,
  "calibration_date": "2025-01-15T10:00:00Z",
  "cartridges": [
    {
      "slot": 1,
      "ingredient": "Bergamot",
      "cas_number": "8007-75-8",
      "fill_level": 95,
      "last_refill": "2025-01-10T00:00:00Z"
    },
    {
      "slot": 2,
      "ingredient": "Rose Absolute",
      "cas_number": "8007-01-0",
      "fill_level": 88,
      "last_refill": "2025-01-08T00:00:00Z"
    }
  ],
  "dispense_settings": {
    "default_volume_ml": 1.0,
    "mixing_delay_ms": 500,
    "temperature_celsius": 22,
    "fan_speed": "medium"
  }
}`}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          DIY Arduino Build
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          For makers who want to build their own scent dispenser, here is
          the wiring guide for the Arduino-based setup.
        </p>

        <div className="card">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Required Components
          </h4>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>- Arduino Mega 2560</li>
            <li>- 6x Micro solenoid valves (3V)</li>
            <li>- 6x MOSFET driver modules (IRF520)</li>
            <li>- 5V DC fan (40mm)</li>
            <li>- 12V power supply</li>
            <li>- Silicone tubing (2mm ID)</li>
            <li>- 6x Glass cartridge holders</li>
            <li>- Custom PCB or breadboard</li>
          </ul>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-primary-400 mb-2">
            Wiring Diagram (Pin Mapping)
          </h4>
          <CodeBlock
            code={`// Pin mapping for Arduino Mega
const int VALVE_PINS[] = {2, 3, 4, 5, 6, 7};
const int FAN_PIN = 8;
const int LED_PIN = 13;

// MOSFET gate connections:
// Valve 1 (Slot 1) -> Pin 2 -> MOSFET Gate -> Solenoid
// Valve 2 (Slot 2) -> Pin 3 -> MOSFET Gate -> Solenoid
// ...
// Fan             -> Pin 8 -> MOSFET Gate -> DC Fan

// Each solenoid:
// Drain -> Solenoid negative
// Source -> GND
// Solenoid positive -> 12V

// Serial communication at 115200 baud
// Receives OSC JSON over serial, parses ingredients,
// maps to cartridge slots, actuates valves proportionally`}
            language="cpp"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Troubleshooting
        </h3>
        <div className="space-y-3">
          {[
            {
              q: "Device not detected after plugging in",
              a: "Ensure drivers are installed. Try a different USB port. Check that the device firmware is up to date with: pns devices firmware --check",
            },
            {
              q: "Cartridge not dispensing",
              a: "Check fill level with pns cartridge status. Ensure tubing is not kinked. Run pns calibrate --slot N to recalibrate the specific slot.",
            },
            {
              q: "Scent smells different than expected",
              a: "Verify cartridge contents match the configured ingredients. Temperature affects volatility -- ensure room is between 18-25 degrees C. Allow 5 minutes for full olfactory development.",
            },
            {
              q: "Formula has ingredients not in my cartridges",
              a: "The CLI will warn about missing ingredients. Use pns substitute --suggest to get alternative ingredient recommendations that match your available cartridges.",
            },
          ].map((item) => (
            <div key={item.q} className="card">
              <h4 className="text-sm font-medium text-gray-200 mb-1">
                {item.q}
              </h4>
              <p className="text-xs text-gray-400">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocTab>("osc");

  const tabs = [
    { key: "osc" as DocTab, label: "OSC Spec", icon: FileCode2 },
    { key: "api" as DocTab, label: "API Reference", icon: Server },
    { key: "hardware" as DocTab, label: "Hardware Guide", icon: Cpu },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Documentation
        </h1>
        <p className="text-gray-500">
          Everything you need to build with Prompt & Smell
        </p>
      </motion.div>

      {/* Tab navigation */}
      <motion.div
        className="flex gap-1 mb-8 p-1 bg-surface-800/50 rounded-lg inline-flex"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-surface-600/80 text-primary-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "osc" && <OSCSpec />}
        {activeTab === "api" && <APIReference />}
        {activeTab === "hardware" && <HardwareGuide />}
      </motion.div>
    </div>
  );
}
