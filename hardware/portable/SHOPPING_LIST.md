# Portable Scent Device -- Complete Shopping List

Everything needed to build one Prompt & Smell portable scent device.
Prices are approximate USD based on typical AliExpress/Amazon pricing as
of early 2026.

---

## Electronics

| Item | Qty | Specs | Est. Price | Notes |
|------|-----|-------|------------|-------|
| ESP32-WROOM-32 dev board | 1 | 38-pin, USB-C preferred | $5-8 | Any ESP32 DevKit v1 compatible board works. Make sure it has USB-C and an onboard voltage regulator. |
| Piezo atomizer disc | 6 | 16mm diameter, 113kHz resonant frequency | $1 each, $6 total | Search "16mm ultrasonic mist maker atomizer disc". Often sold in packs of 5-10. The 113kHz frequency is standard for small mist makers. |
| Micro blower/fan | 1 | 20mm, 3.3-5V DC, brushless | $3-5 | Search "20mm micro blower fan 5V". A 3010 (30x10mm) blower works too if 20mm is unavailable; adjust the fan bay dimensions. |
| MOSFET breakout board | 1 | 6-channel, N-channel logic-level MOSFETs | $5 | Option A: 6-channel MOSFET board (search "6ch MOSFET Arduino"). Option B: Buy 6x individual IRLZ44N or AO3400 MOSFETs on a protoboard. Logic-level gate threshold (3.3V compatible) is required. |
| TP4056 LiPo charger module | 1 | USB-C input, 1A charge rate, with protection circuit | $2 | Get the version WITH battery protection (has DW01A chip). The USB-C variant is preferred over Micro-USB. |
| 3.7V LiPo battery | 1 | 1000mAh, 50x30x8mm (503048 or similar) | $5-8 | Search "503048 LiPo battery". Any 3.7V single-cell LiPo in the 800-1200mAh range that fits 50x30x8mm will work. Must have a JST-PH 2.0 connector or bare leads. |
| WS2812B NeoPixel LED | 1 | Single addressable RGB LED, 5mm or SMD | $1 | A single WS2812B on a small breakout PCB is easiest. Alternatively use a common-cathode RGB LED with 3 GPIO pins (modify firmware accordingly). |
| Resistors (10K ohm) | 8 | 1/4W, through-hole or SMD | $0.50 | 6x for MOSFET gate pull-downs, 2x for battery voltage divider (100K ohm for the divider -- see below). |
| Resistors (100K ohm) | 2 | 1/4W, for battery voltage divider | $0.25 | Two 100K resistors in series from battery to GND, midpoint to ADC pin. |
| Resistor (330 ohm) | 1 | 1/4W, for NeoPixel data line | $0.10 | Series resistor on NeoPixel data line to prevent signal reflections. |
| Capacitor (100uF electrolytic) | 1 | 6.3V or higher, for NeoPixel power | $0.15 | Decoupling cap near the NeoPixel VCC/GND. |
| Capacitor (100nF ceramic) | 1 | For ADC noise filtering | $0.10 | Place between GPIO 34 and GND. |
| Protoboard / perfboard | 1 | 30x20mm or similar small size | $0.50 | For building the MOSFET driver circuit if not using a pre-made breakout. |
| Wire (30AWG silicone) | 1 roll | Multiple colors, stranded | $3 | Silicone-insulated wire is flexible and heat-resistant. Get at least red, black, and 2-3 signal colors. |
| M2 brass heat-set inserts | 4 | M2 x 3mm length | $1 (pack of 50) | For secure ESP32 mounting. Press into printed posts with a soldering iron. |
| M2 x 5mm screws | 6 | Pan head, Phillips or hex | $1 (pack of 50) | 4 for ESP32, 2 for MOSFET board. |

**Electronics subtotal: approximately $30-45**

---

## Scent Cartridge Materials

### Pre-Blended Accord Solutions

Each cartridge holds approximately 2ml of scent solution diluted in
Dipropylene Glycol (DPG) at 10-20% concentration. Mix the accords yourself
from the raw ingredients listed below, or purchase pre-blended fragrance
oils from a supplier.

| Accord | Channel | Blend Recipe (in DPG at 15%) | Key Ingredients |
|--------|---------|------------------------------|-----------------|
| Floral | Ch 0 | 5% rose absolute + 5% jasmine absolute + 3% geraniol + 2% linalool in DPG | Rose, jasmine, geraniol |
| Woody | Ch 1 | 5% sandalwood oil + 5% cedarwood oil (Atlas) + 3% vetiver oil + 2% patchouli oil in DPG | Sandalwood, cedar, vetiver |
| Fresh | Ch 2 | 5% bergamot oil (FCF) + 5% linalool + 3% hedione + 2% dihydromyrcenol in DPG | Bergamot, linalool, hedione |
| Warm | Ch 3 | 5% vanillin (in DPG) + 4% benzoin resinoid + 3% cinnamon bark oil + 3% frankincense oil in DPG | Vanillin, benzoin, cinnamon |
| Sweet | Ch 4 | 5% ethyl maltol (in DPG) + 5% gamma-decalactone + 3% vanillin (in DPG) + 2% ethyl vanillin in DPG | Ethyl maltol, gamma-decalactone, vanillin |
| Clean | Ch 5 | 5% galaxolide (in DPG) + 5% linalool + 3% ambroxan (in DPG) + 2% Iso E Super in DPG | Galaxolide, linalool, ambroxan |

**Mixing instructions:**
1. Weigh out the fragrance raw materials by percentage into a small glass vial.
2. Fill the remainder with DPG (dipropylene glycol) as the carrier solvent.
3. Shake well and let macerate for 24-48 hours before loading into pods.
4. Use a 3ml syringe or glass pipette to fill each cartridge pod with 2ml.

**Note:** If you have already purchased the ingredients from the main
Prompt & Smell hardware shopping list, you have most of these materials.
See `hardware/ingredient_map.json` for the full 16-ingredient inventory.

### Wicking and Consumables

| Item | Qty | Specs | Est. Price | Notes |
|------|-----|-------|------------|-------|
| Felt sheet (polyester or wool blend) | 1 | 3mm thick, at least 150x150mm | $3 | Cut into 12mm diameter circles for the cartridge wicking pads. Polyester felt is more chemically resistant than wool. |
| Small glass vials | 6 | 5ml, with screw cap | $3 (pack of 12) | For mixing and storing the accord solutions before loading into cartridge pods. |
| 3ml syringes | 2 | Luer-lock, no needle needed | $1 | For precision filling of cartridge pods. |
| DPG (Dipropylene Glycol) | 100ml | Perfume-grade, 99%+ purity | $5 | Primary carrier/solvent for all accord solutions. |

### Raw Fragrance Materials (if not already purchased)

Reference the main ingredient shopping list for individual raw material
sources and prices. The key materials needed for the 6 accord blends:

| Material | CAS | Accord(s) | Typical Price (30ml) |
|----------|-----|-----------|---------------------|
| Rose absolute | 8007-01-0 | Floral | $15-25 |
| Jasmine absolute | 8022-96-6 | Floral | $15-25 |
| Geraniol | 106-24-1 | Floral | $4-6 |
| Sandalwood oil | 8006-87-9 | Woody | $10-20 |
| Cedarwood oil (Atlas) | 8000-27-9 | Woody | $3-5 |
| Vetiver oil | 8016-96-4 | Woody | $5-8 |
| Patchouli oil | 8014-09-3 | Woody | $4-6 |
| Bergamot oil (FCF) | 8007-75-8 | Fresh | $5-8 |
| Linalool | 78-70-6 | Fresh, Clean | $4-6 |
| Hedione | 24851-98-7 | Fresh | $5-8 |
| Dihydromyrcenol | 18479-58-8 | Fresh | $4-6 |
| Vanillin (10% in DPG) | 121-33-5 | Warm, Sweet | $3-5 |
| Benzoin resinoid | 9000-05-9 | Warm | $5-8 |
| Cinnamon bark oil | 8015-91-6 | Warm | $4-6 |
| Frankincense oil | 8016-36-2 | Warm | $5-8 |
| Ethyl maltol (10% in DPG) | 4940-11-8 | Sweet | $4-6 |
| Gamma-decalactone | 706-14-9 | Sweet | $4-6 |
| Galaxolide (50% in DPG) | 1222-05-5 | Clean | $5-8 |
| Ambroxan (10% in DPG) | 6790-58-5 | Clean | $5-8 |
| Iso E Super | 54464-57-2 | Clean | $4-6 |

**Note:** Many of these are already in the standard 16-ingredient kit.
You do not need to buy duplicates. Budget assumes you already have
approximately half of these from the main hardware build.

**Scent materials subtotal: approximately $20-40 (using existing ingredients from the main kit)**

---

## 3D Printing

| Item | Qty | Est. Price | Notes |
|------|-----|------------|-------|
| PETG filament | 50-80g | $5 | Approximately 3-5% of a standard 1kg spool. Any color; white or black recommended for the case. Print cartridge caps in different colors for identification. |
| M2 screws (assorted) | 6 | $2 (pack of assorted) | Included above in electronics but listed here for visibility. |

**3D printing subtotal: approximately $5-8**

---

## Tools Required (not included in budget)

These are common tools most makers already have:

- Soldering iron and solder (lead-free preferred)
- Wire strippers for 30AWG wire
- Multimeter for testing connections
- 3D printer (FDM, with heated bed for PETG)
- Small Phillips screwdriver for M2 screws
- Scissors or circle punch for cutting felt pads
- Syringe for filling cartridge pods
- Hot glue gun (optional, for securing modules)
- Precision scale (0.01g) for mixing scent solutions

---

## Total Budget Summary

| Category | Cost Range |
|----------|------------|
| Electronics | $30-45 |
| Scent materials (from existing kit) | $20-40 |
| 3D printing filament | $5-8 |
| **Total** | **$55-93** |

If purchasing all fragrance raw materials from scratch (no existing kit),
add approximately $80-120 for the full ingredient set.

---

## Recommended Suppliers

### Electronics
- **AliExpress:** Best prices for ESP32 boards, MOSFETs, piezo discs, fans
- **Amazon:** Faster shipping for TP4056 modules, NeoPixels, wire
- **Adafruit / SparkFun:** Premium ESP32 boards and NeoPixel breakouts
- **LCSC / JLCPCB:** If ordering a custom PCB instead of protoboard

### Fragrance Materials
- **Creating Perfume (creatingperfume.com):** Beginner-friendly kits
- **Perfumer's Apprentice (shop.perfumersapprentice.com):** Wide selection
- **Pell Wall Perfumes (pellwall.com):** UK-based, good starter sets
- **Aroma-Zone (aroma-zone.com):** EU-based, essential oils and synthetics

### 3D Printing
- **eSUN PETG:** Reliable, wide color range
- **Prusament PETG:** Premium quality, consistent diameter
- **Overture PETG:** Budget option, good results
