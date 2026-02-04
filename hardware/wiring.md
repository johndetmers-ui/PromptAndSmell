# Prompt and Smell -- Hardware Wiring Reference

## Overview

This document describes the hardware components, wiring, and assembly
instructions for the Prompt and Smell scent dispensing system. The system
uses an array of 16 peristaltic pumps controlled by an Arduino Mega (or
Raspberry Pi) to dispense precise volumes of fragrance ingredients.

---

## Hardware Components

### Controller Board

**Option A: Arduino Mega 2560 (Recommended for beginners)**
- 54 digital I/O pins (15 with PWM)
- Native USB serial at 115200 baud
- 5V logic, powered via USB or barrel jack
- Use with external motor driver boards for pump control

**Option B: Raspberry Pi 4 (Recommended for network/HTTP control)**
- Full Linux environment; can run the Python controller directly
- GPIO header for motor driver communication
- Built-in WiFi for remote control
- Requires a HAT or external driver boards for motor control

### Peristaltic Pumps (x16)

- **Type:** 12V DC peristaltic dosing pumps
- **Suggested model:** Kamoer KFS or equivalent micro peristaltic pump
- **Flow rate:** 1-5 ml/min (adjustable via PWM or voltage)
- **Tubing:** Silicone, food-grade, 2mm ID x 4mm OD
- **Connector:** Barbed fittings for 4mm OD tubing

### Motor Driver Boards (x2)

- **Type:** 8-channel MOSFET driver module (e.g., IRF520 or IRL540 based)
- **Voltage rating:** 12V, 5A per channel minimum
- **Logic input:** 3.3V or 5V compatible (TTL)
- **Two boards of 8 channels each = 16 pump channels total**

Alternative: A single 16-channel relay module can be used instead of
MOSFET drivers, though MOSFETs allow PWM speed control.

### Power Supply

- **Pump power:** 12V DC, 10A minimum (12V x 0.5A per pump x 16 pumps = 8A peak)
- **Suggested:** 12V 15A switching power supply (e.g., Mean Well LRS-200-12)
- **Controller power:** 5V via USB (Arduino) or 5V 3A USB-C (Raspberry Pi)
- **IMPORTANT:** Use separate power rails for logic (5V) and motors (12V).
  Connect grounds together but keep power supplies independent.

### Tubing and Fittings

- **Pump tubing:** Silicone, food-grade, 2mm ID x 4mm OD (fits standard peristaltic pump heads)
- **Distribution tubing:** Silicone, 3mm ID x 5mm OD (from reservoir to pump inlet)
- **Outlet manifold tubing:** Silicone, 2mm ID x 4mm OD (from pump outlet to mixing point)
- **Connectors:** Barbed Y-connectors, straight connectors, Luer lock fittings
- **CRITICAL:** All tubing must be food-grade silicone or PTFE. Do not use PVC or
  rubber tubing as fragrance chemicals (especially essential oils and alcohol)
  will degrade them and leach plasticizers.

### Reservoirs

- **Type:** 50-500 ml glass bottles with PTFE-lined caps
- **Fittings:** Two holes per cap -- one for the suction tube (to pump), one for
  an air vent (filtered with a small PTFE membrane filter)
- **Material:** Glass or HDPE only. Do not use polystyrene, PET, or standard
  plastics as fragrance chemicals and ethanol will attack them.
- **Labeling:** Each reservoir must be clearly labeled with the ingredient name,
  CAS number, and pump channel number.

### Mixing Chamber

- **Type:** Small glass vial (10-50 ml) with a narrow neck
- **All 16 pump outlet tubes converge into this vial**
- **Removable for the user to take the finished fragrance**
- **Consider a small magnetic stir bar and stir plate for mixing**

### Enclosure

- **Material:** Laser-cut acrylic or 3D-printed PLA/PETG
- **Ventilation:** The enclosure must be well-ventilated. Fragrance chemicals
  produce strong vapors. Include ventilation slots or a small fan.
- **Access:** Hinged or removable top for reservoir replacement.

---

## Pin Connections

### Arduino Mega 2560 to Motor Driver Boards

The 16 pump channels are controlled via digital output pins on the Arduino
Mega. Each pin connects to the signal input of one MOSFET driver channel.

```
Arduino Pin  |  Driver Board  |  Channel  |  Pump  |  Ingredient
-------------|----------------|-----------|--------|---------------------------
D22          |  Board 1, CH1  |  0        |  P0    |  Ethanol (denatured)
D23          |  Board 1, CH2  |  1        |  P1    |  DPG
D24          |  Board 1, CH3  |  2        |  P2    |  IPM
D25          |  Board 1, CH4  |  3        |  P3    |  Bergamot Oil
D26          |  Board 1, CH5  |  4        |  P4    |  Linalool
D27          |  Board 1, CH6  |  5        |  P5    |  Hedione
D28          |  Board 1, CH7  |  6        |  P6    |  Rose Absolute
D29          |  Board 1, CH8  |  7        |  P7    |  Jasmine Absolute
D30          |  Board 2, CH1  |  8        |  P8    |  Iso E Super
D31          |  Board 2, CH2  |  9        |  P9    |  Cedarwood Oil (Atlas)
D32          |  Board 2, CH3  |  10       |  P10   |  Sandalwood Oil
D33          |  Board 2, CH4  |  11       |  P11   |  Vanillin (in DPG)
D34          |  Board 2, CH5  |  12       |  P12   |  Ambroxan (in DPG)
D35          |  Board 2, CH6  |  13       |  P13   |  Galaxolide
D36          |  Board 2, CH7  |  14       |  P14   |  Patchouli Oil
D37          |  Board 2, CH8  |  15       |  P15   |  Dihydromyrcenol
```

### Motor Driver Board Wiring (per board, 8 channels)

```
Motor Driver Pin  |  Connection
------------------|------------------------------------------
VCC               |  5V from Arduino (logic power)
GND               |  Common ground (Arduino GND + PSU GND)
SIG1-SIG8         |  Arduino digital pins (see table above)
V+                |  12V from power supply (motor power)
V- / GND          |  Power supply ground
OUT1+ / OUT1-     |  Pump 1 motor leads (repeat for each channel)
```

### Power Distribution

```
Component              |  Voltage  |  Source
-----------------------|-----------|----------------------------------
Arduino Mega           |  5V       |  USB cable from host computer
Motor Driver Logic     |  5V       |  Arduino 5V pin (or separate 5V)
Peristaltic Pumps      |  12V      |  12V 15A switching PSU
Motor Driver V+        |  12V      |  12V 15A switching PSU

GROUND BUS: All grounds (Arduino GND, PSU GND, Driver GND) must be
connected together on a common ground bus.
```

---

## Wiring Diagram (Text Description)

```
                        +------------------+
                        |   Host Computer  |
                        |   (Python CLI)   |
                        +--------+---------+
                                 |
                              USB Serial
                                 |
                        +--------+---------+
                        |  Arduino Mega    |
                        |  2560            |
                        |                  |
                        |  D22-D29 -----+--+----> Motor Driver Board 1
                        |  D30-D37 -----+--+----> Motor Driver Board 2
                        |  5V, GND -----+  |
                        +------------------+
                                           |
                        +------------------+
                        |  12V 15A PSU     |
                        |  V+ ------------>+----> Driver Board 1 V+
                        |  V+ ------------>+----> Driver Board 2 V+
                        |  GND ----------->+----> Common Ground Bus
                        +------------------+

    Motor Driver Board 1 (Channels 0-7)     Motor Driver Board 2 (Channels 8-15)
    +----------------------------------+    +----------------------------------+
    | SIG1 <-- D22    OUT1 --> Pump 0   |    | SIG1 <-- D30    OUT1 --> Pump 8   |
    | SIG2 <-- D23    OUT2 --> Pump 1   |    | SIG2 <-- D31    OUT2 --> Pump 9   |
    | SIG3 <-- D24    OUT3 --> Pump 2   |    | SIG3 <-- D32    OUT3 --> Pump 10  |
    | SIG4 <-- D25    OUT4 --> Pump 3   |    | SIG4 <-- D33    OUT4 --> Pump 11  |
    | SIG5 <-- D26    OUT5 --> Pump 4   |    | SIG5 <-- D34    OUT5 --> Pump 12  |
    | SIG6 <-- D27    OUT6 --> Pump 5   |    | SIG6 <-- D35    OUT6 --> Pump 13  |
    | SIG7 <-- D28    OUT7 --> Pump 6   |    | SIG7 <-- D36    OUT7 --> Pump 14  |
    | SIG8 <-- D29    OUT8 --> Pump 7   |    | SIG8 <-- D37    OUT8 --> Pump 15  |
    +----------------------------------+    +----------------------------------+

    Each pump connects as follows:

    +-------------+        +-----------+        +----------------+
    | Reservoir   | -----> | Pump Head | -----> | Mixing Chamber |
    | (glass jar) | tubing | (12V DC)  | tubing | (glass vial)   |
    +-------------+        +-----------+        +----------------+
```

---

## Safety Considerations

### Electrical Safety

- Use a fused 12V power supply. A 15A supply with a 10A fuse on the output
  rail is recommended.
- Keep all high-voltage (12V) wiring away from liquid tubing paths. A leak
  near exposed 12V wiring is a fire and shock hazard.
- Use proper wire gauges: minimum 18 AWG for 12V motor power, 22 AWG for
  signal/logic wires.
- Mount the power supply in an enclosed, ventilated area.

### Chemical Safety

- Ethanol (the primary carrier) is flammable. Ensure no open flames, sparks,
  or hot surfaces near the dispenser. The enclosure must not trap ethanol
  vapors.
- Essential oils and aroma chemicals can be skin irritants and sensitizers.
  Wear nitrile gloves when handling reservoirs and tubing.
- Some fragrance ingredients (eugenol, cinnamal, oakmoss) are restricted
  allergens. Label reservoirs clearly with hazard information.
- Ensure adequate ventilation. A fume hood or well-ventilated room is ideal.

### Tubing and Material Compatibility

- Use ONLY silicone or PTFE tubing. Essential oils and ethanol will dissolve
  PVC, natural rubber, and many plastics within hours.
- Use glass or HDPE for reservoirs. Polystyrene and PET will crack or cloud
  when exposed to essential oils.
- Replace tubing every 3-6 months or when discoloration or swelling is
  observed.

### Pump Priming

- Before first use, prime each pump by running it with the reservoir
  connected until liquid flows continuously from the outlet with no air
  bubbles.
- After priming, run the calibration script (calibration.py) to measure
  actual flow rates.
- When changing ingredients in a reservoir, flush the pump and tubing with
  ethanol (3 full pump cycles) before loading the new ingredient.

### Cleaning Procedure

1. Remove the mixing chamber vial.
2. Place each pump's inlet tube into a container of clean ethanol.
3. Run FLUSH command (or manually run each pump for 30 seconds).
4. Repeat step 3 with clean ethanol.
5. Optionally run pumps with distilled water, then ethanol again to remove
   any water residue.
6. Allow tubes to air-dry before reconnecting to fragrance reservoirs.
7. Clean the mixing chamber with ethanol and allow to dry.

---

## Bill of Materials

| Qty | Component                                 | Approx. Cost (USD) |
|-----|-------------------------------------------|---------------------|
| 1   | Arduino Mega 2560 (genuine or compatible) | $15-45              |
| 16  | 12V DC peristaltic pumps (Kamoer KFS)     | $8-15 each ($128-240 total) |
| 2   | 8-channel MOSFET driver board (IRF520)    | $5-10 each ($10-20 total) |
| 1   | 12V 15A switching power supply            | $20-35              |
| 1   | USB-A to USB-B cable (for Arduino)        | $5                  |
| 5m  | Silicone tubing, 2mm ID x 4mm OD          | $10-15              |
| 5m  | Silicone tubing, 3mm ID x 5mm OD          | $10-15              |
| 16  | Glass reservoir bottles (100ml)           | $2-5 each ($32-80 total) |
| 16  | PTFE-lined bottle caps with 2 holes       | $3-5 each ($48-80 total) |
| 1   | Mixing chamber glass vial (30ml)          | $5-10               |
| 1   | Enclosure material (acrylic sheets)       | $30-50              |
| 1   | Wiring kit (jumper wires, terminal blocks)| $15-20              |
| 1   | 10A fuse and fuse holder                  | $5                  |
| 1   | Power switch (illuminated rocker)         | $3-5                |
| 1   | PCB prototype board or breadboard         | $5-10               |
| 16  | Barbed tubing connectors (assorted)       | $10-15              |
| 1   | Small PC fan (40mm, 12V, for ventilation) | $5-8                |
|-----|-------------------------------------------|---------------------|
|     | **ESTIMATED TOTAL**                       | **$350-650**        |

### Optional Upgrades

| Component                                     | Approx. Cost (USD) |
|-----------------------------------------------|---------------------|
| Raspberry Pi 4 (4GB) instead of Arduino       | $55-75              |
| Magnetic stir plate + micro stir bars         | $30-50              |
| 3D-printed enclosure (custom design)          | $20-40 (filament)   |
| LCD/OLED display for status                   | $10-20              |
| Precision scale (0.01g) for calibration       | $20-40              |
| PTFE membrane vent filters (16 pcs)           | $15-25              |
| Luer lock fittings set                        | $15-20              |

---

## Assembly Notes

1. **Mount the pumps** in two rows of 8 on the enclosure base plate. Leave
   at least 3cm between pumps for tubing routing and airflow.

2. **Wire the motor drivers** to the Arduino using the pin mapping table
   above. Use a common ground bus (a terminal strip works well).

3. **Connect pump motors** to the driver board outputs. Polarity determines
   pump direction -- ensure all pumps flow from reservoir toward the mixing
   chamber. If a pump runs backward, swap its motor leads.

4. **Install reservoirs** above the pump inlets (gravity-assisted priming).
   Route suction tubing from each reservoir through its pump and out to the
   mixing chamber manifold.

5. **Upload the firmware** to the Arduino (firmware not included in this
   repository -- it must parse the serial protocol defined in protocol.py
   and drive the digital output pins accordingly).

6. **Prime all pumps** by running each one until liquid flows without bubbles.

7. **Run calibration** using calibration.py to measure actual flow rates.

8. **Test with simulation mode** first: `python controller.py --file test.json --volume 5 --simulate`

9. **Perform a real dispense** with a small volume to verify everything works.
