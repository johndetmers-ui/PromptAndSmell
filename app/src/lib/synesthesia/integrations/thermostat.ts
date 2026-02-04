// ---------------------------------------------------------------------------
// Thermostat Integration -- Nest / Ecobee Temperature Controller
// ---------------------------------------------------------------------------
// Builds API request bodies for smart thermostat platforms. Includes safety
// limits to prevent extreme temperature changes (max +/- 3 degrees F).
// Actual API calls require user OAuth tokens.
// ---------------------------------------------------------------------------

export type ThermostatProvider = "nest" | "ecobee";

export type TemperatureUnit = "F" | "C";

export type TemperatureDirection = "warmer" | "cooler" | "neutral";

export interface ThermostatState {
  currentTemp: number;
  targetTemp: number;
  unit: TemperatureUnit;
  mode: "heat" | "cool" | "heat-cool" | "off";
  humidity?: number;
  provider: ThermostatProvider;
}

export interface ThermostatCommand {
  provider: ThermostatProvider;
  endpoint: string;
  method: "PUT" | "POST";
  body: Record<string, unknown>;
  description: string;
}

export interface TemperatureCalculation {
  currentTemp: number;
  targetTemp: number;
  delta: number;
  direction: TemperatureDirection;
  unit: TemperatureUnit;
  clamped: boolean;
  originalTarget: number;
}

// Safety constants
const MAX_DELTA_F = 3;
const MAX_DELTA_C = 1.67; // ~3 F

const ABSOLUTE_MIN_F = 60;
const ABSOLUTE_MAX_F = 80;
const ABSOLUTE_MIN_C = 15.5;
const ABSOLUTE_MAX_C = 26.7;

function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5 / 9) * 10) / 10;
}

function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9 / 5 + 32) * 10) / 10;
}

export class ThermostatController {
  private provider: ThermostatProvider;
  private unit: TemperatureUnit;

  constructor(provider: ThermostatProvider = "nest", unit: TemperatureUnit = "F") {
    this.provider = provider;
    this.unit = unit;
  }

  calculateTargetTemp(
    currentTemp: number,
    direction: TemperatureDirection,
    maxDelta: number = MAX_DELTA_F,
    atmosphereTargetTemp?: number
  ): TemperatureCalculation {
    const maxDeltaInUnit = this.unit === "F" ? maxDelta : maxDelta * 5 / 9;
    const absMin = this.unit === "F" ? ABSOLUTE_MIN_F : ABSOLUTE_MIN_C;
    const absMax = this.unit === "F" ? ABSOLUTE_MAX_F : ABSOLUTE_MAX_C;

    let rawTarget: number;

    if (atmosphereTargetTemp !== undefined) {
      rawTarget = atmosphereTargetTemp;
    } else {
      switch (direction) {
        case "warmer":
          rawTarget = currentTemp + maxDeltaInUnit;
          break;
        case "cooler":
          rawTarget = currentTemp - maxDeltaInUnit;
          break;
        case "neutral":
        default:
          rawTarget = currentTemp;
          break;
      }
    }

    // Clamp to max delta from current
    const delta = rawTarget - currentTemp;
    let clamped = false;
    let clampedTarget = rawTarget;

    if (Math.abs(delta) > maxDeltaInUnit) {
      clampedTarget = currentTemp + (delta > 0 ? maxDeltaInUnit : -maxDeltaInUnit);
      clamped = true;
    }

    // Clamp to absolute bounds
    if (clampedTarget < absMin) {
      clampedTarget = absMin;
      clamped = true;
    }
    if (clampedTarget > absMax) {
      clampedTarget = absMax;
      clamped = true;
    }

    // Round to nearest 0.5
    clampedTarget = Math.round(clampedTarget * 2) / 2;

    const actualDirection: TemperatureDirection =
      clampedTarget > currentTemp ? "warmer" :
      clampedTarget < currentTemp ? "cooler" :
      "neutral";

    return {
      currentTemp,
      targetTemp: clampedTarget,
      delta: Math.round((clampedTarget - currentTemp) * 10) / 10,
      direction: actualDirection,
      unit: this.unit,
      clamped,
      originalTarget: rawTarget,
    };
  }

  // Build Nest API request body
  private buildNestCommand(
    targetTemp: number,
    mode?: "heat" | "cool" | "heat-cool"
  ): ThermostatCommand {
    // Nest Smart Device Management API expects Celsius
    const tempC = this.unit === "F" ? fahrenheitToCelsius(targetTemp) : targetTemp;

    const sdmMode = mode || (tempC > 22 ? "cool" : "heat");

    if (sdmMode === "heat-cool") {
      return {
        provider: "nest",
        endpoint: "/enterprises/{project_id}/devices/{device_id}:executeCommand",
        method: "POST",
        body: {
          command: "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange",
          params: {
            heatCelsius: tempC - 1,
            coolCelsius: tempC + 1,
          },
        },
        description: `Set Nest to heat-cool range ${tempC - 1}C - ${tempC + 1}C`,
      };
    }

    const command = sdmMode === "heat"
      ? "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat"
      : "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool";

    const paramKey = sdmMode === "heat" ? "heatCelsius" : "coolCelsius";

    return {
      provider: "nest",
      endpoint: "/enterprises/{project_id}/devices/{device_id}:executeCommand",
      method: "POST",
      body: {
        command,
        params: {
          [paramKey]: tempC,
        },
      },
      description: `Set Nest to ${sdmMode} at ${tempC}C (${targetTemp}${this.unit})`,
    };
  }

  // Build Ecobee API request body
  private buildEcobeeCommand(
    targetTemp: number,
    mode?: "heat" | "cool" | "auto"
  ): ThermostatCommand {
    // Ecobee API expects temperatures in F * 10 (e.g., 72F = 720)
    const tempF = this.unit === "C" ? celsiusToFahrenheit(targetTemp) : targetTemp;
    const ecobeeTemp = Math.round(tempF * 10);

    const holdType = "nextTransition";

    if (mode === "auto" || mode === "heat-cool" as string) {
      return {
        provider: "ecobee",
        endpoint: "/1/thermostat",
        method: "POST",
        body: {
          selection: {
            selectionType: "registered",
            selectionMatch: "",
          },
          functions: [
            {
              type: "setHold",
              params: {
                holdType,
                heatHoldTemp: ecobeeTemp - 10, // 1F below target
                coolHoldTemp: ecobeeTemp + 10, // 1F above target
              },
            },
          ],
        },
        description: `Set Ecobee to auto hold around ${tempF}F`,
      };
    }

    const paramKey = mode === "cool" ? "coolHoldTemp" : "heatHoldTemp";

    return {
      provider: "ecobee",
      endpoint: "/1/thermostat",
      method: "POST",
      body: {
        selection: {
          selectionType: "registered",
          selectionMatch: "",
        },
        functions: [
          {
            type: "setHold",
            params: {
              holdType,
              [paramKey]: ecobeeTemp,
            },
          },
        ],
      },
      description: `Set Ecobee to ${mode || "heat"} hold at ${tempF}F`,
    };
  }

  buildSetTemperatureCommand(
    targetTemp: number,
    mode?: "heat" | "cool" | "heat-cool"
  ): ThermostatCommand {
    if (this.provider === "ecobee") {
      const ecobeeMode = mode === "heat-cool" ? "auto" : mode;
      return this.buildEcobeeCommand(targetTemp, ecobeeMode as "heat" | "cool" | "auto");
    }
    return this.buildNestCommand(targetTemp, mode);
  }

  buildFromAtmosphere(
    currentTemp: number,
    atmosphereDirection: TemperatureDirection,
    atmosphereTargetTemp?: number
  ): {
    calculation: TemperatureCalculation;
    command: ThermostatCommand;
  } {
    const calc = this.calculateTargetTemp(
      currentTemp,
      atmosphereDirection,
      MAX_DELTA_F,
      atmosphereTargetTemp
    );

    const mode: "heat" | "cool" | "heat-cool" =
      calc.direction === "warmer" ? "heat" :
      calc.direction === "cooler" ? "cool" :
      "heat-cool";

    const command = this.buildSetTemperatureCommand(calc.targetTemp, mode);

    return { calculation: calc, command };
  }

  getUnit(): TemperatureUnit {
    return this.unit;
  }

  getProvider(): ThermostatProvider {
    return this.provider;
  }

  static getMaxDelta(unit: TemperatureUnit = "F"): number {
    return unit === "F" ? MAX_DELTA_F : MAX_DELTA_C;
  }
}
