# Prompt and Smell -- 3D Printable Enclosure

Comprehensive 3D printing guide for the ultrasonic diffuser enclosure. This
enclosure houses 16 ultrasonic atomizer channels, a Raspberry Pi, MOSFET
driver boards, a fan, an OLED display, a microphone, and an optional LED
ring -- all in a compact, attractive tower.

---

## Design Overview

The enclosure is a **cylindrical tower** approximately 150mm in diameter and
250mm tall, divided into three main sections that stack and screw together:

```
        +---------------------------+
        |     Top Cover             |  <-- Directional louvers for scent output
        |     (fan shroud)          |      Fan mounted underneath
        +---------------------------+
        |                           |
        |     Reservoir Ring        |  <-- 16 vial slots in a circle
        |     (middle section)      |      Atomizer discs seat below each vial
        |                           |
        +---------------------------+
        |     Electronics           |  <-- Raspberry Pi, MOSFET boards, wiring
        |     Compartment           |      OLED display, LED ring, mic hole
        |     (bottom section)      |
        +---------------------------+
        |     Base Plate            |  <-- Feet, ventilation slots
        +---------------------------+
```

### Key Features
- Snap-fit plus screw assembly (no glue needed)
- Easy access to vials for refilling (top cover lifts off)
- All electronics accessible by removing the reservoir ring
- Cable channels built into the walls for clean wiring
- Ventilation slots to prevent heat buildup and vapor accumulation
- OLED display window and microphone hole on the front panel
- Power jack and USB cutout on the back panel

---

## Parts List

### Part 1: Base Plate

**Description:** The foundation of the enclosure. Provides mounting points
for the Raspberry Pi and ventilation slots on the bottom.

| Property | Value |
|----------|-------|
| Dimensions | 150mm diameter, 5mm thick |
| Material | PETG (recommended) |
| Infill | 40% |
| Layer Height | 0.2mm |
| Supports | None needed |
| Approx. Print Time | 1.5 hours |
| Approx. Filament | 25g |

**Features:**
- 4x M3 mounting holes for Raspberry Pi (spaced 58mm x 49mm, standard Pi 4 pattern)
- 6x ventilation slots (3mm x 30mm) arranged radially on the bottom face
- 4x rubber foot recesses (8mm diameter, 2mm deep) on the bottom
- 4x M3 threaded insert holes around the perimeter for attaching the electronics compartment walls
- Central cable pass-through hole (15mm diameter)

**Dimensional Details:**
```
  Overall:       150mm diameter circle, 5mm height
  Pi mount holes: M3 clearance (3.2mm), 4 holes at standard Pi 4 spacing
                  Hole centers: (25mm, 25mm), (83mm, 25mm),
                  (25mm, 74mm), (83mm, 74mm) relative to Pi board corner
                  Positioned with Pi centered in the base
  Vent slots:    3mm wide x 30mm long, 6 slots evenly spaced at 60-degree intervals
  Foot recesses: 8mm diameter, 2mm deep, positioned at 0/90/180/270 degrees
                  at 65mm from center
  Screw holes:   M3 (3.2mm clearance), 4 holes at 0/90/180/270 degrees
                  at 70mm from center, for wall attachment
```

---

### Part 2: Electronics Compartment Walls

**Description:** A cylindrical wall section that sits on the base plate and
encloses the Raspberry Pi, MOSFET driver boards, and wiring.

| Property | Value |
|----------|-------|
| Dimensions | 150mm outer diameter, 142mm inner diameter (4mm wall), 70mm tall |
| Material | PETG |
| Infill | 30% |
| Layer Height | 0.2mm |
| Supports | Minimal (for front/back panel cutouts) |
| Approx. Print Time | 4 hours |
| Approx. Filament | 55g |

**Features:**
- Front panel cutout for OLED display (27mm x 15mm window at 35mm height)
- Front panel cutout for microphone hole (6mm diameter at 55mm height)
- Front panel recess for optional LED ring mount (40mm diameter, 3mm deep)
- Back panel cutout for DC barrel jack (12mm diameter at 20mm height)
- Back panel cutout for USB access (12mm x 6mm at 15mm height)
- Back panel ventilation slots (3 slots, 3mm x 20mm, at 45mm height)
- 4x M3 screw posts on the bottom edge matching base plate holes
- 4x M3 screw posts on the top edge for reservoir ring attachment
- 2x M2.5 mounting posts for MOSFET driver boards on the inner wall
- Internal cable routing channels (3mm wide grooves in the wall)

**Dimensional Details:**
```
  Outer diameter:   150mm
  Inner diameter:   142mm (4mm wall thickness)
  Height:           70mm
  Wall thickness:   4mm

  OLED window:      27mm wide x 15mm tall, centered on front face
                    Bottom edge at 35mm from base
  Mic hole:         6mm diameter, centered on front face
                    Center at 55mm from base
  LED ring mount:   40mm diameter recess, 3mm deep, centered on front face
                    Center at 45mm from base (behind OLED window area)

  DC jack hole:     12mm diameter, centered on back face
                    Center at 20mm from base
  USB cutout:       12mm wide x 6mm tall, centered on back face
                    Bottom edge at 12mm from base
  Vent slots:       3mm wide x 20mm tall, 3 slots spaced 10mm apart
                    On back face, bottom edges at 40mm from base

  Driver board mounts: 2x M2.5 holes on inner wall, spaced for the
                       specific board dimensions (typically 50mm x 25mm)
                       Positioned on left and right inner walls

  Cable channels:   3mm wide x 2mm deep grooves running vertically
                    on inner wall surface, 4 channels at 90-degree intervals
```

---

### Part 3: Reservoir Ring

**Description:** The main middle section of the enclosure. Contains 16 slots
arranged in a circle, each sized to hold a standard 10ml amber glass vial
with an atomizer disc seated below it.

| Property | Value |
|----------|-------|
| Dimensions | 150mm outer diameter, 100mm tall |
| Material | PETG (chemical resistance is critical here) |
| Infill | 35% |
| Layer Height | 0.2mm |
| Supports | Yes (for vial slot overhangs) |
| Approx. Print Time | 6 hours |
| Approx. Filament | 80g |

**Features:**
- 16 vial slots arranged in a circle (55mm radius from center)
- Each slot: 23mm diameter (fits 22mm diameter vials with slight clearance), 55mm deep
- At the bottom of each slot: a recessed seat for the 20mm piezo atomizer disc
- Small wiring channels between each slot for atomizer disc wires
- Central open column for air flow and wiring
- 4x M3 screw holes on bottom edge (aligns with electronics compartment top)
- 4x M3 screw holes on top edge (aligns with top cover)
- Slight taper at the top of each slot for easy vial insertion

**Dimensional Details:**
```
  Outer diameter:      150mm
  Height:              100mm
  Wall thickness:      4mm (outer wall)

  Vial slots:          16 slots evenly spaced at 22.5-degree intervals
                       Slot center radius: 55mm from enclosure center
                       Slot diameter: 23mm (clearance for 22mm vials)
                       Slot depth: 55mm (vial sits with ~5mm protruding)
                       Slot bottom: 3mm thick floor with 20mm hole for atomizer
                       disc seat

  Atomizer disc seat:  20.5mm diameter recess, 3mm deep
                       Centered at the bottom of each vial slot
                       2x 1mm wire pass-through holes on each side

  Central column:      30mm diameter open space in the center
                       For air flow and wire routing from atomizers
                       down to the electronics compartment

  Wiring channels:     2mm wide x 2mm deep grooves on the inner face
                       of each slot wall, running from the atomizer seat
                       down to the central column

  Screw holes:         M3 clearance (3.2mm), 4 holes at 0/90/180/270 degrees
                       at 70mm from center, on both top and bottom faces
```

---

### Part 4: Reservoir Caps / Vial Holders (x16)

**Description:** Individual retaining rings that hold the glass vials in
place in the reservoir ring slots and route the atomizer wiring.

| Property | Value |
|----------|-------|
| Dimensions | 26mm outer diameter, 8mm tall |
| Material | PETG |
| Infill | 100% (solid for strength) |
| Layer Height | 0.12mm (fine detail) |
| Supports | None needed |
| Approx. Print Time | 20 min total (print all 16 at once) |
| Approx. Filament | 10g total |

**Features:**
- Press-fit ring that sits on top of the vial in its slot
- Prevents the vial from being knocked out accidentally
- Small tab for easy removal when refilling
- O-ring groove on the inner face for a snug seal

**Dimensional Details:**
```
  Outer diameter:     26mm (press-fits into 23mm slot with slight flex)
  Inner diameter:     20mm (vial neck passes through)
  Height:             8mm
  Pull tab:           5mm x 3mm x 2mm tab on one side
  O-ring groove:      1.5mm wide x 1mm deep on inner circumference
```

---

### Part 5: Fan Shroud

**Description:** Mounts a 40mm (or 50mm) fan and creates a mixing chamber
where scent from all atomizers converges before being pushed upward through
the top cover's louvers.

| Property | Value |
|----------|-------|
| Dimensions | 150mm diameter, 35mm tall |
| Material | PETG |
| Infill | 30% |
| Layer Height | 0.2mm |
| Supports | Yes (for fan mount and internal baffles) |
| Approx. Print Time | 2.5 hours |
| Approx. Filament | 30g |

**Features:**
- Central 40mm fan mount (screw pattern: 32mm hole spacing, standard 40mm fan)
- Fan pulls air up through the central column and pushes it through the top
- Internal baffle ring that redirects airflow outward to distribute scent evenly
- Mesh/grille pattern on the sides for secondary air intake
- Sits on top of the reservoir ring

**Dimensional Details:**
```
  Outer diameter:     150mm
  Height:             35mm
  Wall thickness:     3mm

  Fan mount:          40mm x 40mm square opening centered
                      4x M3 screw holes at 32mm spacing (standard 40mm fan)
                      Fan positioned blowing upward (exhaust through top cover)

  Baffle ring:        80mm diameter, 15mm tall annular wall
                      Sits around the fan mount to redirect airflow
                      6x 5mm x 10mm slots in the baffle for air distribution

  Air intake:         8x 3mm x 15mm slots around the outer perimeter
                      Bottom face open to the reservoir ring's central column
```

---

### Part 6: Top Cover

**Description:** The top aesthetic piece with directional louvers for scent
output. Lifts off easily for vial access.

| Property | Value |
|----------|-------|
| Dimensions | 155mm diameter (slight overhang), 20mm tall |
| Material | PETG |
| Infill | 25% |
| Layer Height | 0.12mm (visible surface, fine finish) |
| Supports | Yes (for louver overhangs) |
| Approx. Print Time | 2 hours |
| Approx. Filament | 20g |

**Features:**
- Dome or flat top with radial louver slots for directed scent output
- Slight overhang (2.5mm) past the enclosure body for a finished look
- Inner lip that seats onto the fan shroud for alignment
- No screws needed -- friction fit with a slight twist-lock
- Louvers angled at 30 degrees outward for scent dispersion

**Dimensional Details:**
```
  Outer diameter:     155mm (2.5mm overhang on each side)
  Height:             20mm
  Inner lip:          142mm diameter, 8mm deep (seats into fan shroud)

  Louvers:            12 radial slots, each 3mm wide x 40mm long
                      Angled at 30 degrees from horizontal
                      Arranged radially from center outward
                      Inner radius: 15mm, outer radius: 55mm

  Twist-lock tabs:    2x small tabs on the inner lip, 3mm x 5mm
                      Mate with slots in the fan shroud for secure fit
```

---

### Part 7: Front Panel Insert (optional, alternative to integrated cutouts)

**Description:** A separate front panel piece that snaps into the electronics
compartment wall. Useful if you want to print the display/mic/LED area at
higher resolution separately.

| Property | Value |
|----------|-------|
| Dimensions | 60mm wide x 50mm tall x 4mm thick |
| Material | PETG (translucent for LED visibility if desired) |
| Infill | 100% (solid) |
| Layer Height | 0.12mm |
| Supports | None needed |
| Approx. Print Time | 30 min |
| Approx. Filament | 5g |

**Features:**
- OLED display window (27mm x 15mm rectangular cutout)
- Microphone hole (6mm diameter)
- LED ring mounting posts (if using NeoPixel ring)
- Snap-fit clips on the back for tool-free installation

---

### Part 8: Back Panel Insert (optional)

**Description:** Separate back panel piece with power and USB cutouts.

| Property | Value |
|----------|-------|
| Dimensions | 50mm wide x 40mm tall x 4mm thick |
| Material | PETG |
| Infill | 100% (solid) |
| Layer Height | 0.2mm |
| Supports | None needed |
| Approx. Print Time | 20 min |
| Approx. Filament | 4g |

**Features:**
- DC barrel jack cutout (12mm diameter)
- USB-A cutout (12mm x 6mm) for Pi access
- 3x ventilation slots (3mm x 20mm)
- Snap-fit clips on the back

---

### Part 9: Vial Holders (x16) (alternative to Part 4)

**Description:** Individual cradle-style holders that the glass vials sit in.
These drop into the reservoir ring slots and have a wider base that seats the
atomizer disc below the vial.

| Property | Value |
|----------|-------|
| Dimensions | 22mm diameter x 55mm tall (fits inside slot) |
| Material | PETG |
| Infill | 30% |
| Layer Height | 0.2mm |
| Supports | None needed |
| Approx. Print Time | 2 hours total (print all 16 at once) |
| Approx. Filament | 30g total |

**Dimensional Details:**
```
  Outer diameter:    22mm (fits into 23mm slot with slight clearance)
  Inner diameter:    19mm (vial sits inside)
  Height:            55mm
  Bottom:            Solid 3mm floor with 20mm atomizer disc seat
                     2x wire holes (1mm) through the floor
  Lip:               1mm rim at the top to retain the vial
```

---

### Part 10: Cable Management Clips (x8)

**Description:** Small clips that snap onto the inner walls of the enclosure
to organize wiring.

| Property | Value |
|----------|-------|
| Dimensions | 10mm x 8mm x 5mm each |
| Material | PETG |
| Infill | 100% (solid) |
| Layer Height | 0.2mm |
| Supports | None needed |
| Approx. Print Time | 15 min total |
| Approx. Filament | 3g total |

**Features:**
- C-clip design that holds 2-4 jumper wires
- Adhesive pad recess on the back (for double-sided tape mounting)
- Alternative: snap-fit tab for the cable channel grooves

---

## Print Settings Summary

| Part | Material | Infill | Layer | Supports | Time | Filament |
|------|----------|--------|-------|----------|------|----------|
| 1. Base plate | PETG | 40% | 0.2mm | No | 1.5h | 25g |
| 2. Electronics walls | PETG | 30% | 0.2mm | Minimal | 4h | 55g |
| 3. Reservoir ring | PETG | 35% | 0.2mm | Yes | 6h | 80g |
| 4. Reservoir caps (x16) | PETG | 100% | 0.12mm | No | 20min | 10g |
| 5. Fan shroud | PETG | 30% | 0.2mm | Yes | 2.5h | 30g |
| 6. Top cover | PETG | 25% | 0.12mm | Yes | 2h | 20g |
| 7. Front panel (opt.) | PETG | 100% | 0.12mm | No | 30min | 5g |
| 8. Back panel (opt.) | PETG | 100% | 0.2mm | No | 20min | 4g |
| 9. Vial holders (x16, alt.) | PETG | 30% | 0.2mm | No | 2h | 30g |
| 10. Cable clips (x8) | PETG | 100% | 0.2mm | No | 15min | 3g |
| **Total** | | | | | **~19h** | **~262g** |

---

## Material Recommendations

### PETG (Recommended)

PETG is the recommended material for this project:
- **Chemical resistance:** Resistant to essential oils, ethanol, and DPG.
  This is critical because fragrance chemicals will come in contact with
  the reservoir ring and vial holders.
- **Durability:** Tougher and more flexible than PLA, less likely to crack.
- **Temperature resistance:** Glass transition ~80C, safe for continuous use.
- **Print difficulty:** Moderate. Slightly stringy, but manageable with
  proper retraction settings.

**Recommended print temperature:** 230-245C nozzle, 70-80C bed.
**Recommended brands:** Hatchbox PETG, Overture PETG, eSUN PETG.

### ABS (Alternative)

ABS is also suitable:
- Excellent chemical resistance
- Higher temperature resistance (~105C glass transition)
- Requires an enclosed printer (warping issues in open air)
- Requires post-processing (acetone vapor smoothing) for a nice finish
- Not recommended unless you have experience printing ABS

### PLA -- DO NOT USE

**PLA is NOT suitable for this project.** Essential oils (especially
d-limonene, which is present in all citrus oils) act as solvents for PLA.
Over time, PLA parts in contact with fragrance chemicals will soften,
warp, and eventually dissolve. PETG and ABS are both resistant to these
chemicals.

### Nozzle and Printer Requirements

- **Nozzle:** Standard 0.4mm brass nozzle is fine for all parts
- **Build volume:** Minimum 160mm x 160mm x 100mm (for the reservoir ring)
- **Heated bed:** Required for PETG (70-80C)
- **Enclosure:** Not required for PETG (but helpful for ABS)

---

## Assembly Instructions

### Step 1: Print All Parts

Print all parts using the settings in the table above. Allow parts to cool
completely before assembly. Remove any support material and clean up edges
with a hobby knife or sandpaper.

### Step 2: Install Heat-Set Inserts (optional)

If using heat-set inserts instead of nuts, install M3 inserts into:
- Base plate: 4x perimeter holes
- Electronics compartment walls: 4x bottom edge, 4x top edge
- Reservoir ring: 4x bottom edge, 4x top edge

Use a soldering iron at 220C to press inserts into the holes.

### Step 3: Mount the Raspberry Pi

1. Place the Raspberry Pi on the base plate, aligning the mounting holes.
2. Secure with 4x M3 x 8mm screws and nuts (or into heat-set inserts).
3. Ensure the USB and Ethernet ports face toward the back panel cutout.
4. Connect the MicroSD card before mounting (easier to access).

### Step 4: Mount the MOSFET Driver Boards

1. Mount the two 8-channel MOSFET driver boards on the inner wall of the
   electronics compartment using M2.5 screws.
2. Position Board 1 on the left inner wall, Board 2 on the right.
3. Leave enough clearance for jumper wire connections.

### Step 5: Wire the Electronics

1. Connect GPIO jumper wires from the Raspberry Pi header to the MOSFET
   board signal inputs according to the pin mapping in `config.py`:
   ```
   Channel 0  -> GPIO 4   -> Board 1, CH1
   Channel 1  -> GPIO 17  -> Board 1, CH2
   Channel 2  -> GPIO 27  -> Board 1, CH3
   Channel 3  -> GPIO 22  -> Board 1, CH4
   Channel 4  -> GPIO 5   -> Board 1, CH5
   Channel 5  -> GPIO 6   -> Board 1, CH6
   Channel 6  -> GPIO 13  -> Board 1, CH7
   Channel 7  -> GPIO 19  -> Board 1, CH8
   Channel 8  -> GPIO 26  -> Board 2, CH1
   Channel 9  -> GPIO 21  -> Board 2, CH2
   Channel 10 -> GPIO 20  -> Board 2, CH3
   Channel 11 -> GPIO 16  -> Board 2, CH4
   Channel 12 -> GPIO 24  -> Board 2, CH5
   Channel 13 -> GPIO 25  -> Board 2, CH6
   Channel 14 -> GPIO 8   -> Board 2, CH7
   Channel 15 -> GPIO 7   -> Board 2, CH8
   Fan        -> GPIO 18  (PWM-capable pin)
   ```

2. Connect the 5V power supply to the MOSFET boards' V+ input.

3. Connect all grounds together: Pi GND + MOSFET board GND + Power supply GND.

4. Connect the 40mm fan to GPIO 18 through a small MOSFET or transistor
   (the fan draws more current than GPIO can supply directly). Alternatively,
   wire the fan directly to 5V with a MOSFET on the ground side, gate
   connected to GPIO 18.

5. Connect the OLED display via I2C:
   - SDA -> GPIO 2 (Pi SDA1)
   - SCL -> GPIO 3 (Pi SCL1)
   - VCC -> 3.3V
   - GND -> GND

6. Route all wires through the cable channels in the walls. Use the cable
   management clips to keep things tidy.

### Step 6: Attach the Electronics Compartment to the Base

1. Place the electronics compartment walls onto the base plate.
2. Align the 4 screw holes.
3. Secure with M3 x 12mm screws from the bottom.
4. Verify the front and back panel cutouts align with the OLED display,
   microphone, power jack, and USB port.

### Step 7: Prepare the Atomizer Discs

1. Solder 15cm leads (thin, flexible wire) to each of the 16 piezo atomizer
   discs. Mark polarity (red/black or +/-).
2. If using vial holders (Part 9), seat each atomizer disc into the bottom
   recess of a vial holder, feed wires through the wire holes.
3. If not using vial holders, seat the discs directly into the reservoir
   ring slot bottoms.

### Step 8: Install the Reservoir Ring

1. Thread all 16 pairs of atomizer wires through the central column of
   the reservoir ring, routing them through the wiring channels.
2. Place the reservoir ring on top of the electronics compartment.
3. Align the 4 screw holes and secure with M3 screws.
4. Connect each atomizer wire pair to the corresponding MOSFET board output
   channel. Ensure the positive wire goes to the V+ output and the negative
   to the V- output on each channel.

### Step 9: Install the Fan

1. Mount the 40mm fan into the fan shroud using the 4x M3 screw holes.
2. Orient the fan so it blows upward (air flows from the reservoir ring
   area up through the top cover).
3. Route the fan power wire down through the central column to the
   electronics compartment.
4. Place the fan shroud on top of the reservoir ring.

### Step 10: Load the Vials

1. Prepare 16 vials of pre-diluted scent solution (see SHOPPING_LIST.md).
2. Label each vial with the ingredient name and channel number (0-15).
3. Drop each vial into its corresponding slot in the reservoir ring.
4. Secure with the reservoir caps (Part 4) or vial holders (Part 9).
5. Ensure the bottom of each vial makes contact with (or sits just above)
   the piezo atomizer disc. The disc needs to be in contact with the liquid
   to atomize it effectively.

### Step 11: Place the Top Cover

1. Set the top cover on the fan shroud.
2. Twist slightly to engage the twist-lock tabs.
3. The cover should sit securely but be easily removable for vial access.

### Step 12: Connect External Peripherals

1. Plug the USB microphone into one of the Pi's USB ports.
2. Connect the 5V power supplies (one for the Pi via USB-C, one for the
   atomizer MOSFET boards via barrel jack).
3. If using a display/speaker: connect via USB or 3.5mm jack.

### Step 13: Software Setup and Test

1. Install Raspberry Pi OS on the MicroSD card and boot the Pi.
2. Install Python dependencies: `pip install -r requirements.txt`
3. Test in simulation mode:
   ```
   python diffuser_controller.py --file ../../spec/sample_scent.json --simulate
   ```
4. Test with hardware:
   ```
   python diffuser_controller.py --file ../../spec/sample_scent.json --intensity low
   ```
5. Test voice control:
   ```
   python voice_controller.py --api-key <YOUR_KEY> --simulate
   ```

---

## Troubleshooting

### Atomizer not producing mist
- Ensure the piezo disc is submerged in liquid (it needs liquid contact).
- Check that the vial is seated properly and the liquid level is above the disc.
- Verify the MOSFET channel is firing (test with an LED temporarily).
- Try a different piezo disc (they can fail after extended use).

### Weak scent output
- Increase intensity: `--intensity high` or `--intensity max`
- Check that the fan is working and blowing in the correct direction.
- Verify the top cover louvers are not obstructed.
- Check ingredient dilution levels (5-10% in DPG is correct).

### Fan not spinning
- Verify GPIO 18 connection and the MOSFET circuit for the fan.
- Test the fan by connecting it directly to 5V to confirm it works.
- Check that the software is enabling the fan pin.

### OLED display not showing
- Verify I2C connections (SDA to GPIO 2, SCL to GPIO 3).
- Run `i2cdetect -y 1` on the Pi to check if the display is detected.
- Typical I2C address for SSD1306 is 0x3C.

### Voice recognition not working
- Ensure the USB microphone is detected: `arecord -l`
- Test the microphone: `arecord -d 5 test.wav && aplay test.wav`
- Check that the `speech_recognition` and `pyaudio` packages are installed.
- On Raspberry Pi, you may need: `sudo apt install portaudio19-dev`
