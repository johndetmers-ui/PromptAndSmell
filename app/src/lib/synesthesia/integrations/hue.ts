// ---------------------------------------------------------------------------
// Philips Hue Integration -- Smart Lighting Controller
// ---------------------------------------------------------------------------
// Builds and sends Hue API request bodies for controlling Philips Hue lights.
// Requires HUE_BRIDGE_IP and HUE_API_KEY environment variables for actual
// communication with a Hue Bridge on the local network.
// ---------------------------------------------------------------------------

export interface HueXYColor {
  xy: [number, number];
  bri: number;
}

export interface HueCTColor {
  ct: number; // Mirek (153-500)
  bri: number;
}

export interface HueLightState {
  on: boolean;
  bri?: number; // 1-254
  hue?: number; // 0-65535
  sat?: number; // 0-254
  xy?: [number, number];
  ct?: number; // 153-500 mirek
  alert?: "none" | "select" | "lselect";
  effect?: "none" | "colorloop";
  transitiontime?: number; // in 100ms units
}

export interface HueGroupAction extends HueLightState {
  scene?: string;
}

export interface HueAnimationConfig {
  type: "breathe" | "candle" | "aurora" | "storm" | "sunset";
  speed: number; // 1-10, where 1 is slowest
  colors: string[]; // hex colors
}

interface HueRequestBody {
  method: "PUT" | "POST" | "GET";
  url: string;
  body?: Record<string, unknown>;
}

// Utility: convert hex color to CIE xy color space for Hue API
function hexToXY(hex: string): [number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const rCorrected = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  const gCorrected = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  const bCorrected = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Wide RGB D65 conversion
  const X = rCorrected * 0.664511 + gCorrected * 0.154324 + bCorrected * 0.162028;
  const Y = rCorrected * 0.283881 + gCorrected * 0.668433 + bCorrected * 0.047685;
  const Z = rCorrected * 0.000088 + gCorrected * 0.072310 + bCorrected * 0.986039;

  const sum = X + Y + Z;
  if (sum === 0) return [0.3127, 0.3290]; // D65 white point fallback

  const x = X / sum;
  const y = Y / sum;

  return [
    Math.round(x * 10000) / 10000,
    Math.round(y * 10000) / 10000,
  ];
}

// Utility: convert Kelvin to Mirek for Hue CT
function kelvinToMirek(kelvin: number): number {
  const clamped = Math.max(2000, Math.min(6500, kelvin));
  return Math.round(1000000 / clamped);
}

// Utility: convert brightness 0-100 to Hue bri 1-254
function brightnessToBri(brightness: number): number {
  const clamped = Math.max(0, Math.min(100, brightness));
  return Math.max(1, Math.round((clamped / 100) * 254));
}

// Utility: convert transition ms to Hue transitiontime (100ms units)
function msToTransitionTime(ms: number): number {
  return Math.round(ms / 100);
}

export class PhilipsHueController {
  private bridgeIp: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(bridgeIp?: string, apiKey?: string) {
    this.bridgeIp = bridgeIp || process.env.HUE_BRIDGE_IP || "";
    this.apiKey = apiKey || process.env.HUE_API_KEY || "";
    this.baseUrl = `http://${this.bridgeIp}/api/${this.apiKey}`;
  }

  isConfigured(): boolean {
    return this.bridgeIp.length > 0 && this.apiKey.length > 0;
  }

  // --- Core methods ---

  setColor(
    hex: string,
    brightness: number = 100,
    transitionMs: number = 400,
    groupId?: string
  ): HueRequestBody {
    const xy = hexToXY(hex);
    const bri = brightnessToBri(brightness);
    const transitiontime = msToTransitionTime(transitionMs);

    const state: HueLightState = {
      on: true,
      xy,
      bri,
      transitiontime,
    };

    if (groupId) {
      return {
        method: "PUT",
        url: `${this.baseUrl}/groups/${groupId}/action`,
        body: state as unknown as Record<string, unknown>,
      };
    }

    // Default: apply to group 0 (all lights)
    return {
      method: "PUT",
      url: `${this.baseUrl}/groups/0/action`,
      body: state as unknown as Record<string, unknown>,
    };
  }

  setColorTemperature(
    kelvin: number,
    brightness: number = 100,
    transitionMs: number = 400,
    groupId?: string
  ): HueRequestBody {
    const ct = kelvinToMirek(kelvin);
    const bri = brightnessToBri(brightness);
    const transitiontime = msToTransitionTime(transitionMs);

    const state: HueLightState = {
      on: true,
      ct,
      bri,
      transitiontime,
    };

    const target = groupId || "0";
    return {
      method: "PUT",
      url: `${this.baseUrl}/groups/${target}/action`,
      body: state as unknown as Record<string, unknown>,
    };
  }

  startAnimation(
    config: HueAnimationConfig,
    groupId?: string
  ): HueRequestBody[] {
    const target = groupId || "0";
    const requests: HueRequestBody[] = [];

    switch (config.type) {
      case "breathe": {
        // Use Hue's built-in breathe alert with a color
        const xy = config.colors.length > 0 ? hexToXY(config.colors[0]) : hexToXY("#FF8800");
        requests.push({
          method: "PUT",
          url: `${this.baseUrl}/groups/${target}/action`,
          body: {
            on: true,
            xy,
            bri: 200,
            alert: "lselect" as const,
          },
        });
        break;
      }

      case "candle": {
        // Warm flickering: alternate between warm colors at fast intervals
        const warmColors = config.colors.length >= 2
          ? config.colors
          : ["#FF6B00", "#FF8800", "#FF4500", "#FFB347"];
        const transitiontime = Math.max(1, Math.round((11 - config.speed) * 2));

        for (const color of warmColors.slice(0, 4)) {
          const xy = hexToXY(color);
          const bri = brightnessToBri(40 + Math.random() * 40);
          requests.push({
            method: "PUT",
            url: `${this.baseUrl}/groups/${target}/action`,
            body: {
              on: true,
              xy,
              bri,
              transitiontime,
            },
          });
        }
        break;
      }

      case "aurora": {
        // Slowly cycle through colors using colorloop effect
        const auroraColors = config.colors.length > 0
          ? config.colors
          : ["#00FF88", "#0088FF", "#8800FF", "#FF0088"];
        const xy = hexToXY(auroraColors[0]);
        requests.push({
          method: "PUT",
          url: `${this.baseUrl}/groups/${target}/action`,
          body: {
            on: true,
            xy,
            bri: brightnessToBri(70),
            effect: "colorloop" as const,
            transitiontime: Math.round((11 - config.speed) * 10),
          },
        });
        break;
      }

      case "storm": {
        // Dark blue base with occasional bright white flashes
        const stormBase = hexToXY(config.colors[0] || "#1a1a3e");
        requests.push({
          method: "PUT",
          url: `${this.baseUrl}/groups/${target}/action`,
          body: {
            on: true,
            xy: stormBase,
            bri: brightnessToBri(20),
            transitiontime: 0,
          },
        });
        // Flash command
        requests.push({
          method: "PUT",
          url: `${this.baseUrl}/groups/${target}/action`,
          body: {
            on: true,
            xy: hexToXY("#FFFFFF"),
            bri: 254,
            transitiontime: 0,
            alert: "select" as const,
          },
        });
        break;
      }

      case "sunset": {
        // Gradual transition through sunset colors
        const sunsetColors = config.colors.length >= 3
          ? config.colors
          : ["#FF6B35", "#FF2D2D", "#8B0000", "#2D1B4E", "#0A0A2E"];
        const stepDuration = Math.round(((11 - config.speed) * 50));

        for (const color of sunsetColors) {
          const xy = hexToXY(color);
          const brightnessStep = sunsetColors.indexOf(color);
          const bri = brightnessToBri(
            Math.max(10, 80 - brightnessStep * (60 / sunsetColors.length))
          );
          requests.push({
            method: "PUT",
            url: `${this.baseUrl}/groups/${target}/action`,
            body: {
              on: true,
              xy,
              bri,
              transitiontime: stepDuration,
            },
          });
        }
        break;
      }
    }

    return requests;
  }

  turnOff(transitionMs: number = 1000, groupId?: string): HueRequestBody {
    const target = groupId || "0";
    return {
      method: "PUT",
      url: `${this.baseUrl}/groups/${target}/action`,
      body: {
        on: false,
        transitiontime: msToTransitionTime(transitionMs),
      },
    };
  }

  stopAnimation(groupId?: string): HueRequestBody {
    const target = groupId || "0";
    return {
      method: "PUT",
      url: `${this.baseUrl}/groups/${target}/action`,
      body: {
        effect: "none",
        alert: "none",
      },
    };
  }

  getGroups(): HueRequestBody {
    return {
      method: "GET",
      url: `${this.baseUrl}/groups`,
    };
  }

  getLights(): HueRequestBody {
    return {
      method: "GET",
      url: `${this.baseUrl}/lights`,
    };
  }

  // --- Execute a request (actual HTTP call to bridge) ---

  async execute(request: HueRequestBody): Promise<unknown> {
    const options: RequestInit = {
      method: request.method,
      headers: { "Content-Type": "application/json" },
    };
    if (request.body) {
      options.body = JSON.stringify(request.body);
    }
    const response = await fetch(request.url, options);
    return response.json();
  }

  async executeAll(requests: HueRequestBody[], delayMs: number = 300): Promise<unknown[]> {
    const results: unknown[] = [];
    for (let i = 0; i < requests.length; i++) {
      const result = await this.execute(requests[i]);
      results.push(result);
      if (i < requests.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return results;
  }
}

// Export utility functions for use in other modules
export { hexToXY, kelvinToMirek, brightnessToBri };
