# Portable Scent Device -- 3D Printable Enclosure

3D printing guide for the Prompt & Smell portable scent device. All parts
are designed for PETG filament for chemical resistance against fragrance
solvents and essential oils. Do NOT use PLA -- it will degrade on contact
with the scent solutions.

---

## Design Overview

- **Form factor:** Rounded rectangle, 80mm x 50mm x 30mm
- **Construction:** Two-piece snap-fit case (top shell + bottom shell)
- **Top shell:** 6 small holes (4mm diameter) for atomizer mist output, fan exhaust grille with 1mm slats
- **Side:** USB-C port cutout (9mm x 3.5mm) for charging via TP4056 module
- **Bottom:** Belt clip attachment point with snap-fit dovetail (removable)
- **Weight (assembled, without battery):** approximately 40g printed + 25g electronics

### Interior Layout

```
Top Shell (looking down from above)
+------------------------------------------+
|  [Fan Grille]    [Mist Holes x6]         |
|                                           |
|  +------+------+------+                  |
|  |Pod 0 |Pod 1 |Pod 2 |   Fan Bay       |
|  |Floral|Woody |Fresh |   (20mm)        |
|  +------+------+------+                  |
|  |Pod 3 |Pod 4 |Pod 5 |                  |
|  |Warm  |Sweet |Clean |   NeoPixel       |
|  +------+------+------+   Window         |
|                                           |
+------------------------------------------+

Bottom Shell (looking down from above)
+------------------------------------------+
|                                           |
|  +---------+   +------------------+      |
|  |         |   |                  |      |
|  |  ESP32  |   |  LiPo Battery   |      |
|  |  Board  |   |  50x30x8mm      |      |
|  |         |   |                  |      |
|  +---------+   +------------------+      |
|                                           |
|  [MOSFET Board]  [TP4056 USB-C]         |
|                                           |
|  ============ Belt Clip Rail =========== |
+------------------------------------------+
```

---

## Parts List

### 1. Bottom Case

- **Dimensions:** 80mm x 50mm x 15mm (outer), 2mm wall thickness
- **Material:** PETG
- **Infill:** 30%
- **Layer height:** 0.2mm
- **Supports:** None needed (print open-side-up)
- **Estimated print time:** 1 hour 45 minutes
- **Notes:** Contains mounting posts for ESP32 board (M2 screw holes, 2.2mm
  diameter, 4mm deep, spaced to match ESP32-WROOM-32 dev board mounting
  holes). Battery compartment is a recessed pocket 52mm x 32mm x 9mm with
  a retainer clip slot. MOSFET breakout board mounts on 2x M2 posts.
  TP4056 module sits in a pocket at the side edge with the USB-C port
  aligned to the side cutout. Snap-fit tabs (4x) on the top edge to mate
  with the top case. Belt clip dovetail rail on the bottom exterior.

### 2. Top Case

- **Dimensions:** 80mm x 50mm x 15mm (outer), 2mm wall thickness
- **Material:** PETG
- **Infill:** 30%
- **Layer height:** 0.2mm
- **Supports:** Yes -- minimal, for the fan grille overhang
- **Estimated print time:** 2 hours
- **Notes:** Contains 6 cylindrical cartridge bays (16mm inner diameter,
  21mm deep) arranged in a 3x2 grid with 2mm spacing between bays. Each
  bay has a small slot at the bottom for the piezo atomizer disc wires to
  route out. Fan bay is a 22mm diameter cylindrical pocket, 10mm deep,
  positioned adjacent to the cartridge grid. Mist output holes (6x 4mm)
  are directly above each cartridge bay. Fan exhaust grille is a row of
  1mm slats over the fan bay. NeoPixel window is a 5mm diameter hole with
  a thin translucent wall (0.4mm single perimeter) to diffuse the LED
  light. Snap-fit receptacles (4x) on the bottom edge to mate with the
  bottom case.

### 3. Cartridge Pods (x6)

- **Dimensions:** 15mm outer diameter, 20mm tall, 1.5mm wall thickness
- **Material:** PETG
- **Infill:** 100% (solid for liquid containment)
- **Layer height:** 0.15mm (fine for good seal)
- **Supports:** None
- **Estimated print time:** 15 minutes each, 1 hour 30 minutes total
- **Notes:** Cylindrical reservoir holding approximately 2ml of pre-diluted
  scent solution. The inner cavity is 12mm diameter x 17mm deep. The bottom
  has a press-fit recess (16mm diameter, 1mm deep) for the piezo atomizer
  disc. A felt wicking pad (12mm diameter, 3mm thick) sits inside the pod
  and draws liquid to the atomizer disc by capillary action. The top has a
  1mm lip for the snap-on cap. The outer wall has a small notch for
  alignment with the cartridge bay slot.

### 4. Cartridge Caps (x6)

- **Dimensions:** 16mm outer diameter, 5mm tall
- **Material:** PETG
- **Infill:** 100%
- **Layer height:** 0.15mm
- **Supports:** None
- **Estimated print time:** 5 minutes each, 30 minutes total
- **Notes:** Snap-on caps that seal the cartridge pods when not in use or
  during transport. Each cap has a press-fit inner ring (12.5mm diameter)
  that seats into the pod opening. The center has a small air vent hole
  (0.5mm) that is normally sealed by a silicone dot (applied by the user).
  Color-code the caps by printing each in a different color or applying
  labels:
  - Channel 0 (Floral): Pink filament or label
  - Channel 1 (Woody): Brown filament or label
  - Channel 2 (Fresh): Teal filament or label
  - Channel 3 (Warm): Orange filament or label
  - Channel 4 (Sweet): Light pink filament or label
  - Channel 5 (Clean): Light blue filament or label

### 5. Belt Clip

- **Dimensions:** 50mm x 20mm x 12mm
- **Material:** PETG
- **Infill:** 60% (needs to be strong)
- **Layer height:** 0.2mm
- **Supports:** Yes -- for the clip hook overhang
- **Estimated print time:** 25 minutes
- **Notes:** Removable belt clip that snaps onto the dovetail rail on the
  bottom of the case. Spring-loaded clip design with a 3mm thick flexing
  arm that wraps around belt/pocket edges up to 5mm thick. The dovetail
  connector slides on from one end and has a small detent bump to prevent
  accidental release.

### 6. Fan Mount Bracket

- **Dimensions:** 24mm x 24mm x 5mm
- **Material:** PETG
- **Infill:** 50%
- **Layer height:** 0.2mm
- **Supports:** None
- **Estimated print time:** 10 minutes
- **Notes:** Press-fit bracket that holds the 20mm micro blower inside the
  fan bay in the top case. Has a central 20mm hole for the blower, 4 small
  tabs for friction-fit, and a small channel for the fan wires to route to
  the main PCB area.

### 7. Battery Retainer Clip

- **Dimensions:** 52mm x 10mm x 5mm
- **Material:** PETG
- **Infill:** 50%
- **Layer height:** 0.2mm
- **Supports:** None
- **Estimated print time:** 8 minutes
- **Notes:** A U-shaped clip that presses down onto the LiPo battery to
  hold it securely in the battery compartment. Has two snap tabs on each
  end that clip into slots on the bottom case walls. Allows easy battery
  removal for replacement by flexing the clip upward.

---

## Print Settings Summary

| Part              | Qty | Material | Infill | Layer  | Supports | Time Est. |
|-------------------|-----|----------|--------|--------|----------|-----------|
| Bottom case       | 1   | PETG     | 30%    | 0.20mm | No       | 1h 45m    |
| Top case          | 1   | PETG     | 30%    | 0.20mm | Yes      | 2h 00m    |
| Cartridge pod     | 6   | PETG     | 100%   | 0.15mm | No       | 1h 30m    |
| Cartridge cap     | 6   | PETG     | 100%   | 0.15mm | No       | 0h 30m    |
| Belt clip         | 1   | PETG     | 60%    | 0.20mm | Yes      | 0h 25m    |
| Fan mount bracket | 1   | PETG     | 50%    | 0.20mm | No       | 0h 10m    |
| Battery retainer  | 1   | PETG     | 50%    | 0.20mm | No       | 0h 08m    |
| **TOTAL**         |     |          |        |        |          | **~6h 30m** |

**Total filament:** approximately 50-80g PETG

**Printer requirements:**
- Minimum build volume: 100mm x 60mm x 30mm
- Heated bed recommended (70-80C for PETG)
- Nozzle temperature: 230-245C
- Print speed: 40-50mm/s for best results with PETG

---

## Assembly Instructions

### Step 1: Prepare the Bottom Case

1. Insert 4x M2 brass heat-set inserts into the ESP32 mounting posts
   (use a soldering iron at 200C to press them in).
2. Mount the ESP32-WROOM-32 dev board using 4x M2x5mm screws.
   Orient the board so the USB-C port faces the side cutout.
3. Mount the MOSFET breakout board on its 2x M2 mounting posts using
   M2x5mm screws.
4. Seat the TP4056 USB-C charger module into its pocket at the side
   edge. The USB-C port should be flush with the case wall cutout.
   Secure with a small dab of hot glue if needed.

### Step 2: Install the Battery

1. Place the 3.7V 1000mAh LiPo battery (50x30x8mm form factor) into
   the battery compartment pocket.
2. Route the battery wires to the TP4056 module:
   - Red (positive) to BAT+ pad on TP4056
   - Black (negative) to BAT- pad on TP4056
3. Connect TP4056 output to ESP32 VIN/GND (or through a small boost
   converter if 5V is needed).
4. Snap the battery retainer clip into place over the battery.

### Step 3: Wire the MOSFET Board

Wire the 6 MOSFET gate pins to the ESP32 GPIO pins:

| MOSFET Channel | ESP32 GPIO | Accord   |
|----------------|------------|----------|
| Ch 0           | GPIO 25    | Floral   |
| Ch 1           | GPIO 26    | Woody    |
| Ch 2           | GPIO 27    | Fresh    |
| Ch 3           | GPIO 14    | Warm     |
| Ch 4           | GPIO 12    | Sweet    |
| Ch 5           | GPIO 13    | Clean    |

- Connect MOSFET source pins to GND.
- Connect MOSFET drain pins to the atomizer disc negative leads
  (routed up through the cartridge bay wire slots).
- Connect the atomizer disc positive leads to the battery positive
  rail (3.7V).
- Add a 10K pull-down resistor on each MOSFET gate to prevent
  floating during boot.

### Step 4: Wire the Fan

1. Connect the 20mm micro blower positive wire to MOSFET channel 6
   drain (GPIO 32 gate).
2. Connect the fan negative wire to GND.
3. MOSFET source to GND, gate to GPIO 32 with 10K pull-down.

### Step 5: Wire the NeoPixel

1. Connect the WS2812B NeoPixel data pin to GPIO 33.
2. Connect VCC to 3.3V (or 5V if available from boost converter).
3. Connect GND to GND.
4. Add a 330-ohm resistor in series with the data line.
5. Add a 100uF capacitor between VCC and GND close to the NeoPixel.

### Step 6: Wire Battery Monitoring

1. Create a voltage divider with 2x 100K-ohm resistors in series
   from battery positive to GND.
2. Connect the midpoint of the voltage divider to GPIO 34 (ADC input).
3. Add a 100nF ceramic capacitor from GPIO 34 to GND for noise
   filtering.

### Step 7: Prepare Cartridge Pods

1. For each of the 6 cartridge pods:
   a. Press-fit a 16mm piezo atomizer disc into the bottom recess
      of the pod, wires facing downward.
   b. Cut a 12mm diameter circle from the felt sheet, 3mm thick.
   c. Place the felt wicking pad inside the pod on top of the
      atomizer disc.
   d. Fill the pod with approximately 2ml of the pre-diluted accord
      solution using a syringe or pipette.
   e. Snap the color-coded cap onto the pod.

### Step 8: Install Fan

1. Press the 20mm micro blower into the fan mount bracket.
2. Press the bracket into the fan bay in the top case.
3. Route the fan wires through the wire channel.

### Step 9: Load Cartridges

1. Insert the 6 loaded cartridge pods into the cartridge bays in the
   top case, matching each accord to the correct bay position:
   - Bay 0 (top-left): Floral (pink cap)
   - Bay 1 (top-center): Woody (brown cap)
   - Bay 2 (top-right): Fresh (teal cap)
   - Bay 3 (bottom-left): Warm (orange cap)
   - Bay 4 (bottom-center): Sweet (light pink cap)
   - Bay 5 (bottom-right): Clean (light blue cap)
2. Route the atomizer disc wires down through the bay slots.

### Step 10: Final Assembly

1. Connect all atomizer disc wires to the MOSFET board drain terminals.
2. Verify all wiring connections with a multimeter (continuity check).
3. Snap the top case onto the bottom case. The 4 snap-fit tabs should
   click securely.
4. Optionally attach the belt clip to the dovetail rail on the bottom.
5. Plug in a USB-C cable to charge the battery. The TP4056 red LED
   should light up during charging and turn blue/green when full.

### Step 11: First Power-On

1. The ESP32 should boot and the NeoPixel should turn blue (idle).
2. Open the Serial Monitor at 115200 baud to see debug output.
3. Flash the firmware using the Arduino IDE:
   - Board: ESP32 Dev Module
   - Upload Speed: 921600
   - Flash Frequency: 80MHz
   - Partition Scheme: Default 4MB with spiffs
4. Use the BLE controller or web app to connect and test each accord
   channel individually at low intensity before running a full blend.

---

## Design Notes

- **Chemical resistance:** PETG is required because PLA degrades when
  exposed to essential oils and fragrance-grade solvents like DPG. PETG
  provides good resistance to these chemicals.
- **Snap-fit tolerances:** Print a test snap-fit tab and receptacle first
  to calibrate your printer. Typical clearance is 0.2-0.3mm depending on
  printer accuracy.
- **Cartridge pod seal:** The pods are not airtight by design (the felt
  wick needs airflow). For storage and transport, the caps provide
  sufficient sealing. For long-term storage, wrap pods in cling film.
- **Wicking performance:** Replace felt pads after approximately 50
  refills or when wicking performance degrades. The felt absorbs residual
  scent between refills, so avoid cross-contaminating accords.
- **Ventilation:** The mist holes and fan grille provide airflow for
  diffusion. Do not block them during operation.
