# Prompt and Smell -- Ultrasonic Diffuser Shopping List

This is the complete shopping list for building the ultrasonic atomizer-based
scent diffuser. This design replaces peristaltic pumps with piezoelectric
atomizer discs, resulting in a simpler, quieter, and more affordable build.

---

## Electronics

| Qty | Component | Approx. Cost (USD) | Notes |
|-----|-----------|---------------------|-------|
| 1 | Raspberry Pi 4 Model B (2GB RAM) | $35-45 | 2GB is sufficient. Pi Zero 2 W ($15) also works but has fewer GPIO pins and no USB-A ports. |
| 1 | Raspberry Pi power supply (5V 3A USB-C) | $8-10 | Official Raspberry Pi PSU recommended for stability. |
| 1 | MicroSD card (16GB minimum) | $5-8 | For Raspberry Pi OS. Class 10 or better. |
| 16 | Ultrasonic piezo atomizer discs (20mm, 113kHz) | $15-25 total | Sold in packs of 5-10. Search "20mm ultrasonic mist maker disc" or "piezo atomizer disc 113kHz." About $1-2 each. |
| 2 | 8-channel MOSFET driver board (IRF520 or IRL540) | $8-10 each ($16-20 total) | Each board has 8 channels. Two boards = 16 channels for 16 atomizers. 3.3V logic compatible. |
| 1 | 40mm 5V DC fan | $3-5 | For pushing atomized scent toward the user. A 50mm fan also works. Must be 5V (not 12V) since we are running everything from 5V. |
| 1 | SSD1306 OLED display (0.96 inch, I2C, 128x64) | $4-6 | For displaying current scent name, intensity, and status. I2C connection (only 2 GPIO pins). |
| 1 | USB microphone | $10-15 | Any USB microphone works. A small omnidirectional desktop mic or a USB lavalier mic. Look for one with noise cancellation if the environment is noisy. |
| 1 | 5V 5A power supply (barrel jack or USB) | $8-12 | Powers the atomizer discs through the MOSFET boards. The Pi gets its own USB-C power. Alternatively, a single 5V 8A supply can power everything with a splitter. |
| 1 | Jumper wire kit (male-to-female, female-to-female) | $4-6 | For connecting GPIO pins to MOSFET driver boards. |
| 1 | Header pins (2x20 if needed) | $1-2 | Usually pre-soldered on Pi 4. Needed if using Pi Zero. |
| 1 | Breadboard or PCB prototype board | $3-5 | For organizing power distribution and signal routing. |

### Optional Electronics

| Qty | Component | Approx. Cost (USD) | Notes |
|-----|-----------|---------------------|-------|
| 1 | NeoPixel LED ring (16 LEDs, WS2812B) | $6-10 | For visual status feedback (idle, listening, diffusing). Matches the 16-channel theme. |
| 1 | Logic level shifter (3.3V to 5V, 4-channel) | $2-3 | Needed if NeoPixel data line requires 5V logic (the Pi outputs 3.3V). |
| 1 | Power button with LED | $2-3 | Illuminated rocker switch or momentary button for clean on/off. |

### Electronics Subtotal: $60-90 (required) / $70-106 (with optional items)

---

## Scent Reservoirs

| Qty | Component | Approx. Cost (USD) | Notes |
|-----|-----------|---------------------|-------|
| 16 | 10ml amber glass vials with screw caps | $10-15 for a set of 20 | Standard 22mm diameter x 50mm tall amber glass vials. The amber glass protects light-sensitive essential oils. Available on Amazon or specialty lab supply stores. |
| 16 | Silicone O-rings (22mm ID) | $3-5 for a pack | To seat the atomizer discs into the vials and create a seal. |

Each vial holds a pre-diluted scent solution: the raw fragrance ingredient
diluted to 5-10% concentration in Dipropylene Glycol (DPG). This dilution
is necessary because:
1. Pure essential oils can damage piezo discs over time.
2. Diluted solutions atomize more evenly.
3. It extends the life of expensive ingredients.

### Reservoirs Subtotal: $13-20

---

## 3D Printing Materials

| Qty | Component | Approx. Cost (USD) | Notes |
|-----|-----------|---------------------|-------|
| 1 | PETG filament (200-300g needed) | $8-15 | PETG is recommended for chemical resistance. Do NOT use PLA -- fragrance chemicals (especially essential oils and solvents) can soften and dissolve PLA over time. See the enclosure README for print settings. |
| 4 | M3 x 8mm screws | $1-2 | For mounting the Raspberry Pi to the base plate. |
| 4 | M3 nuts | $0.50-1 | For Pi mounting. |
| 4 | M2.5 x 6mm screws | $1-2 | For mounting the MOSFET driver boards. |
| 4 | M2.5 nuts | $0.50-1 | For driver board mounting. |
| 4 | M3 x 12mm screws | $1-2 | For assembling the enclosure sections together. |
| 8 | M3 heat-set inserts (optional) | $2-3 | For threaded inserts in the 3D printed parts. Makes assembly and disassembly much cleaner. |

### 3D Printing Subtotal: $14-26

---

## Scent Ingredients (16-Ingredient Starter Palette)

The diffuser is loaded with 16 pre-diluted scent solutions, chosen to cover
a broad range of the olfactory spectrum. All ingredients should be diluted
in DPG (Dipropylene Glycol) to the specified concentration before loading
into the vials.

| # | Ingredient | CAS | Category | Dilution | Approx. Cost (USD) | Source |
|---|-----------|-----|----------|----------|---------------------|--------|
| 0 | Bergamot Oil (FCF) | 8007-75-8 | Citrus (top) | 10% in DPG | $8-12 / 15ml | Essential oil suppliers, Amazon |
| 1 | Linalool (synthetic) | 78-70-6 | Fresh-floral (top) | 10% in DPG | $6-10 / 30ml | Perfumer's Apprentice, Creating Perfume |
| 2 | Dihydromyrcenol | 18479-58-8 | Fresh (top) | 10% in DPG | $5-8 / 30ml | Perfumer's Apprentice |
| 3 | Hedione | 24851-98-7 | Fresh-floral (heart) | 10% in DPG | $6-10 / 30ml | Perfumer's Apprentice |
| 4 | Rose Absolute | 8007-01-0 | Floral (heart) | 5% in DPG | $15-25 / 5ml | Essential oil suppliers |
| 5 | Jasmine Absolute | 8022-96-6 | Floral (heart) | 5% in DPG | $12-20 / 5ml | Essential oil suppliers |
| 6 | Geranium Oil | 8000-46-2 | Floral-green (heart) | 10% in DPG | $6-10 / 15ml | Essential oil suppliers |
| 7 | Lavender Oil | 8000-28-0 | Aromatic (heart) | 10% in DPG | $5-8 / 15ml | Essential oil suppliers, widely available |
| 8 | Iso E Super | 54464-57-2 | Woody (base) | 10% in DPG | $6-10 / 30ml | Perfumer's Apprentice |
| 9 | Cedarwood Oil (Atlas) | 8000-27-9 | Woody (base) | 10% in DPG | $5-8 / 15ml | Essential oil suppliers |
| 10 | Sandalwood Oil (Australian) | 8024-35-9 | Woody (base) | 5% in DPG | $12-20 / 5ml | Specialty suppliers |
| 11 | Patchouli Oil | 8014-09-3 | Earthy (base) | 5% in DPG | $6-10 / 15ml | Essential oil suppliers |
| 12 | Vanillin (synthetic) | 121-33-5 | Gourmand (base) | 10% in DPG | $5-8 / 30g | Perfumer's Apprentice (dissolve in DPG) |
| 13 | Ambroxan (synthetic) | 6790-58-5 | Amber (base) | 10% in DPG | $8-15 / 10g | Perfumer's Apprentice (dissolve in DPG) |
| 14 | Galaxolide (50% in DPG) | 1222-05-5 | Musk (base) | 10% in DPG | $6-10 / 30ml | Perfumer's Apprentice |
| 15 | Frankincense Oil | 8016-36-2 | Balsamic (base) | 10% in DPG | $8-12 / 15ml | Essential oil suppliers |

Additionally, you will need:

| Qty | Component | Approx. Cost (USD) | Notes |
|-----|-----------|---------------------|-------|
| 500ml | Dipropylene Glycol (DPG) | $8-12 | Carrier solvent for diluting ingredients. Nearly odorless. |
| 1 | Precision scale (0.01g) | $15-25 | For accurate dilution measurements. |
| 16 | Pipettes or syringes (3ml) | $5-8 | For transferring diluted solutions into vials. |
| 1 | Nitrile gloves (box) | $8-10 | For safe handling of fragrance chemicals. |

### Ingredients Subtotal: $150-250

For the full ingredient reference list (100+ materials with CAS numbers,
categories, usage rates, and IFRA safety limits), see the web app's system
prompt database or the main project's ingredient resources.

---

## Budget Summary

| Category | Cost Range (USD) |
|----------|------------------|
| Electronics (required) | $60-90 |
| Scent reservoirs | $13-20 |
| 3D printing materials | $14-26 |
| Scent ingredients | $150-250 |
| **Total (minimum build)** | **$237-386** |
| Optional electronics | $10-16 |
| **Total (full build)** | **$247-402** |

### Cost Comparison with Peristaltic Pump Design

The original peristaltic pump design costs $350-650. This ultrasonic diffuser
design is significantly cheaper ($237-402) because:
- Piezo atomizer discs cost $1-2 each vs. $8-15 each for peristaltic pumps.
- No 12V high-current power supply needed (everything runs on 5V).
- Simpler wiring (no motor direction concerns, no tubing).
- Smaller enclosure (no large pump array or reservoir bottles).
- No tubing, fittings, or mixing chamber required.

### Trade-offs

The diffuser approach is designed for **scent experience** (room ambiance,
personal scenting) rather than **liquid fragrance production**. It does not
create a bottled perfume -- it atomizes pre-diluted scent solutions into the
air for immediate olfactory experience. For liquid perfume mixing, use the
original peristaltic pump design.

---

## Recommended Suppliers

### Electronics
- **Raspberry Pi:** rpilocator.com (stock checker), The Pi Hut, Adafruit, Vilros
- **Atomizer discs:** Amazon, AliExpress (search "20mm ultrasonic mist maker replacement disc")
- **MOSFET boards:** Amazon, AliExpress (search "8 channel MOSFET driver module")
- **OLED displays:** Amazon, Adafruit, SparkFun
- **USB microphones:** Amazon (search "USB desktop microphone" or "USB condenser microphone")

### Fragrance Ingredients
- **Perfumer's Apprentice (TPA):** shop.perfumersapprentice.com -- best source for synthetic aroma chemicals
- **Creating Perfume:** creatingperfume.com -- wide range of naturals and synthetics
- **Eden Botanicals:** edenbotanicals.com -- high-quality natural essential oils and absolutes
- **Bulk Apothecary:** bulkapothecary.com -- affordable essential oils
- **Amazon:** Good for common essential oils (bergamot, lavender, cedarwood, patchouli)

### 3D Printing
- **Filament:** Hatchbox PETG, Overture PETG, eSUN PETG (all available on Amazon)
- **Screws and inserts:** McMaster-Carr, Amazon, local hardware stores
