# Prompt & Smell -- Project Roadmap

From demo to a working scent-dispensing product.

---

## What To Do This Week

If you have an hour or two and want to make real progress right now, do these things in order:

1. **Get an Anthropic API key.** Go to https://console.anthropic.com, create an account, and generate a key. Add it to your `.env.local` as `ANTHROPIC_API_KEY`.
2. **Create a Supabase project.** Go to https://supabase.com, create a free project, run `schema.sql` in the SQL editor, and copy the URL and anon key into `.env.local`.
3. **Test locally.** Run `npm run dev`, type a scent prompt, and confirm you get a real AI-generated formula back (not mock data).
4. **Order ingredients.** Open `hardware/SHOPPING_LIST.md` and place your first order -- at minimum the three carriers and four or five aroma chemicals. Budget around $80-120 for a minimal start.
5. **Order a precision scale.** You need one that reads to 0.01g. See the shopping list for a specific recommendation. About $25 on Amazon.

That is enough to start mixing AI-generated formulas by hand within a week.

---

## Phase 1: Connect the AI (Software -- No Hardware Needed)

**Goal:** Replace mock/demo data with real AI-generated scent formulas, persist data, and deploy publicly.

**Time estimate:** 1-2 days.

### Tasks

- [ ] **Wire up Anthropic API key.**
  - Get a key from https://console.anthropic.com.
  - Add `ANTHROPIC_API_KEY=sk-ant-...` to `.env.local`.
  - Verify the existing API route (`app/api/...`) calls Claude and returns structured JSON with ingredient names, percentages, and notes.

- [ ] **Connect Supabase for persistence.**
  - Create a free Supabase project at https://supabase.com.
  - Open the SQL editor and run the contents of `spec/schema.sql` (or whatever schema file exists in the project).
  - Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into `.env.local`.
  - Confirm that generated formulas are being saved and can be retrieved.

- [ ] **Deploy to Vercel.**
  - Push the repo to GitHub (private is fine).
  - Import the project in Vercel, add the same environment variables.
  - Confirm the deployed URL works end-to-end.

- [ ] **Tune system prompts.**
  - Generate 20-30 formulas across a range of prompts ("ocean breeze," "old bookstore," "campfire," "fresh laundry," etc.).
  - Check that percentages sum to 100, that ingredient names match your actual inventory, and that the AI is not hallucinating chemicals.
  - Adjust the system prompt to constrain output to your starter palette (Phase 2 ingredients).
  - Add explicit instructions about concentration limits (e.g., linalool max 5%, vanillin max 10%).

- [ ] **Add user authentication.**
  - Use Supabase Auth (email/password or magic link).
  - Gate formula history behind login so users see only their own creations.
  - Optional: add Google OAuth for easier sign-in.

### Deliverable

A live website where anyone can type a prompt, get a real AI-generated scent formula, and see their history.

---

## Phase 2: Source Ingredients (Physical -- Before Hardware)

**Goal:** Acquire a starter palette of 16 ingredients so you can actually mix formulas.

**Time estimate:** 1-2 weeks (mostly shipping time).

### Starter Palette (16 Ingredients)

See `hardware/SHOPPING_LIST.md` for the full list with CAS numbers, suppliers, and prices.

Summary by category:

| Category | Count | Examples |
|---|---|---|
| Carriers / Diluents | 3 | Perfumer's alcohol, DPG, IPM |
| Top Notes | 3 | Bergamot, Lemon, Linalool |
| Heart Notes | 3 | Geraniol, Hedione, Rose oxide |
| Base Notes | 5 | Vanillin, Iso E Super, Ambroxan, Cedarwood, Galaxolide |
| Specialty | 1 | Calone |
| Patchouli (base) | 1 | Patchouli essential oil |

### Where to Buy

These are the main suppliers for hobbyist and semi-professional perfumery:

- **Creating Perfume** (creatingperfume.com) -- US-based, good selection of synthetics, reasonable prices, ships fast domestically.
- **Perfumer's Apprentice** (shop.perfumersapprentice.com) -- US-based, wide catalog, well-known in the DIY community.
- **Pell Wall Perfumes** (pellwall.com) -- UK-based, excellent quality aroma chemicals, ships internationally.
- **Aroma Zone** (aroma-zone.com) -- France-based, strong on essential oils and naturals, good prices for EU buyers.
- **Amazon** -- Fine for carriers (DPG, IPM), lab equipment, and generic supplies. Not recommended for specialty aroma chemicals.

### Budget Estimate

- **Minimal start** (3 carriers + 5-6 aroma chemicals): $80-120
- **Full starter palette** (all 16 items at 30ml each): $150-300
- Prices vary significantly by supplier and region. US buyers will generally do best with Creating Perfume or Perfumer's Apprentice.

### Storage Requirements

- Store all aroma chemicals and essential oils in **amber glass bottles** to protect from UV degradation.
- Keep in a **cool, dark place** -- a cabinet or drawer is fine. Refrigeration is not required for most synthetics but helps extend the life of citrus essential oils.
- **Label everything** with: name, CAS number, date received, supplier, and dilution percentage (if diluted).
- Keep bottles tightly sealed when not in use. Many aroma chemicals are volatile.

### Safety Requirements

- **MSDS/SDS sheets:** Download the Safety Data Sheet for every chemical you buy. Most suppliers provide these on their product pages. Keep them in a folder (digital or physical).
- **Nitrile gloves:** Wear them every time you handle undiluted aroma chemicals. Some (like cinnamic aldehyde, not in the starter palette) are skin sensitizers.
- **Ventilation:** Work in a well-ventilated area. Open a window or use a fan. Do not mix in a small closed room.
- **Eye protection:** Wear safety glasses or goggles when pouring or pipetting. Splashes happen.
- **No ingestion.** These are not food-grade materials. Do not taste, do not use near food preparation surfaces.
- **Spill protocol:** Wipe up spills immediately with paper towels, dispose of in a sealed bag. For large spills of volatile chemicals, ventilate the room and leave for 15-20 minutes.

### Deliverable

A shelf or cabinet with 16 labeled amber bottles, a set of SDS sheets, and basic safety gear.

---

## Phase 3: Manual Formula Testing (Validation)

**Goal:** Mix AI-generated formulas by hand. Find out if the AI actually produces good scents before investing in hardware.

**Time estimate:** 2-4 weeks of experimentation.

### Equipment Needed

- **Precision scale** (0.01g accuracy) -- see shopping list for model recommendation, about $25.
- **Graduated glass pipettes** (1ml, 5ml, 10ml) -- for measuring liquids accurately.
- **Glass beakers** (50ml, 100ml) -- for mixing.
- **Amber glass bottles** (10ml) -- for storing finished blends.
- **Scent test strips** (perfumer's blotters) -- for evaluating without applying to skin.
- **Labels** and a notebook or spreadsheet for recording results.

### Process

1. **Generate 10-20 formulas** using the web app. Choose a range of scent profiles -- floral, woody, fresh, gourmand, aquatic, etc.
2. **Print or write down each formula.** Include ingredient names and percentages.
3. **Mix each formula by weight.** Use the precision scale. A 10ml total batch is a good starting size.
   - Example: if the formula says 30% DPG, 25% Iso E Super, 20% Hedione, 15% linalool, 10% bergamot, then for a 10g batch you weigh 3.00g DPG, 2.50g Iso E Super, 2.00g Hedione, 1.50g linalool, 1.00g bergamot.
4. **Let the blend rest** for at least 24 hours. Many scent compounds need time to marry.
5. **Evaluate on a blotter strip.** Dip the strip, wave it gently, and smell. Note your impressions at 0 minutes, 15 minutes, 1 hour, and 4 hours (this captures top, heart, and base note evolution).
6. **Score each formula.** Use a simple 1-5 scale:
   - Does it smell like what was requested?
   - Is it pleasant?
   - Is it balanced (no single ingredient dominates harshly)?
   - Does it evolve well over time?
7. **Feed corrections back to the system prompt.** If the AI consistently over-uses vanillin, add a constraint. If citrus notes disappear too fast, note that top note percentages may need to be higher.
8. **Iterate.** Regenerate improved formulas and re-test.

### What You Are Looking For

- **Hit rate:** Out of 10 formulas, how many are at least "decent"? If fewer than 3, the system prompt needs significant work.
- **Common failure modes:** Does the AI produce formulas that are too sweet? Too sharp? Too muddled? Identify patterns and address them in the prompt.
- **Ingredient compatibility:** Some combinations clash. Document which pairs or groups work poorly together.
- **Concentration issues:** Are any ingredients at concentrations that are overwhelming or imperceptible? Adjust max/min percentages in the system prompt.

### Documentation

Keep a log (spreadsheet recommended) with columns:
- Formula ID / prompt text
- Ingredient list and percentages
- Resting time before evaluation
- Scent impressions at 0min, 15min, 1hr, 4hr
- Overall score (1-5)
- Notes / corrections to feed back

### Deliverable

A validated set of 5-10 formulas that actually smell good, plus a refined system prompt that reliably produces usable output. This is the critical gate before investing in hardware.

---

## Phase 4: Build Hardware (Automated Dispensing)

**Goal:** Build an automated dispensing rig that can mix formulas without manual weighing.

**Time estimate:** 1-2 weekends for assembly and calibration.

### Prerequisites

- Phase 3 complete (you know the AI produces workable formulas).
- Components ordered and received (see shopping list for full BOM).

### Bill of Materials Summary

| Component | Qty | Approx. Cost | Source |
|---|---|---|---|
| Arduino Mega 2560 | 1 | $15-20 | Amazon / AliExpress |
| 12V peristaltic pumps (dosing type) | 12 | $60-100 | Amazon / AliExpress |
| 8-channel MOSFET driver boards | 2 | $10-16 | Amazon / AliExpress |
| 12V 10A switching power supply | 1 | $12-18 | Amazon |
| Silicone tubing (food-grade, 2-3mm ID) | 5m | $8-12 | Amazon |
| Glass mixing vessel | 1 | $5-10 | Amazon |
| Jumper wires, breadboard | 1 set | $8-12 | Amazon / Adafruit |
| USB-B cable for Arduino | 1 | $5-8 | Amazon |
| Optional: 3D printed pump mount | 1 | $0-20 | Self-print or order |

**Total hardware cost: approximately $125-220.**

### Assembly Steps

1. **Mount the pumps.** Use a 3D printed frame, a piece of plywood with zip ties, or any stable arrangement. All 12 pump inlets will go into ingredient bottles; all 12 outlets converge on the mixing vessel.
2. **Wire the pumps to MOSFET driver boards.** Each pump connects to one MOSFET channel. Follow `hardware/wiring.md` for the exact pin mapping.
3. **Connect MOSFET boards to Arduino Mega.** Digital output pins control the MOSFET gates. Again, see `wiring.md`.
4. **Connect the 12V power supply** to the MOSFET boards' power input. The pumps draw significant current -- do not try to power them from the Arduino.
5. **Connect the Arduino to your computer** via USB.
6. **Flash the firmware.** Upload `hardware/firmware/` to the Arduino using the Arduino IDE or PlatformIO.
7. **Run calibration.** Use `calibration.py` to determine the flow rate of each pump (ml per second of run time). This varies by pump, tubing length, and fluid viscosity.
   - Start with water for initial calibration.
   - Re-calibrate with actual ingredients (viscosities differ).
8. **Test with water first.** Run a few "formulas" using only water to verify that all 12 channels dispense, stop, and the volumes are approximately correct.
9. **Test with real ingredients.** Load a few bottles with actual aroma chemicals and run a known-good formula from Phase 3. Compare the automated result to your hand-mixed version.

### Safety Notes for Hardware

- The 12V power supply can deliver enough current to cause burns or start fires if shorted. Use proper connectors, not bare twisted wires.
- Peristaltic pumps can pinch fingers. Keep hands clear when powered.
- Ensure tubing is securely attached to pump heads and bottles. A loose tube spraying aroma chemicals is a mess and a safety hazard.
- Have paper towels and a catch tray under the mixing area.

### Deliverable

A working dispensing rig that can automatically mix a formula from 12 ingredient bottles into a glass vessel, with calibrated volumes.

---

## Phase 5: End-to-End Integration

**Goal:** Connect the web UI to the hardware so the full loop works: type a prompt, AI generates a formula, pumps dispense it, user smells the result.

**Time estimate:** 1-2 days for integration, then ongoing refinement.

### Integration Architecture

The web app (Next.js on Vercel or local) generates a formula. The formula needs to reach the Python controller (`controller.py`) running on the machine physically connected to the Arduino. Options:

1. **Local HTTP server (recommended for v1).** Run a small Flask or FastAPI server on the machine connected to the Arduino. The Next.js app sends a POST request to `http://localhost:5000/dispense` with the formula JSON. The Python server translates it to serial commands and drives the pumps.

2. **Subprocess call.** If the Next.js app and the Arduino are on the same machine, call `controller.py` as a subprocess from a Next.js API route. Simpler but less flexible.

3. **MQTT (recommended for networked setups).** Use an MQTT broker (e.g., Mosquitto). The web app publishes the formula to a topic; the Python controller subscribes and dispenses. Good if the web app runs on a different machine than the Arduino.

### Tasks

- [ ] **Add a "Dispense" button to the web UI.** It should appear after a formula is generated. Clicking it sends the formula to the dispensing endpoint.
- [ ] **Implement the dispensing endpoint.** Choose one of the three architectures above and implement it.
- [ ] **Handle status feedback.** The controller should report back: dispensing started, dispensing complete, error (pump failure, ingredient empty, etc.). Display this in the UI.
- [ ] **Implement a cleaning cycle.** Between scents, run the carrier solvent (perfumer's alcohol or DPG) through the mixing vessel and output tube to flush residue. Add a "Clean" button to the UI.
- [ ] **Add safety checks.** Do not dispense if any required ingredient is not loaded. Warn if an ingredient level is low (if sensors are available; otherwise, track usage in software).

### Full Loop Walkthrough

1. User opens the web app and types: "a forest after rain."
2. Claude generates a formula: 30% DPG, 20% cedarwood, 15% patchouli, 10% Iso E Super, 10% linalool, 5% geraniol, 5% calone, 5% bergamot.
3. User clicks "Dispense."
4. The web app sends the formula to the local Python controller.
5. The controller maps ingredient names to pump numbers using `ingredient_map.json`.
6. The controller calculates run times based on calibration data and sends serial commands to the Arduino.
7. The pumps run in sequence (or in parallel if the power budget allows), dispensing each ingredient into the mixing vessel.
8. The UI shows "Dispensing complete."
9. The user picks up the mixing vessel, smells it, and (optionally) rates it in the UI.

### Deliverable

A complete working system: prompt to scent in under 60 seconds.

---

## Phase 6: Polish and Scale

**Goal:** Make the system robust, user-friendly, and potentially a product.

**Time estimate:** Ongoing.

### Features

- [ ] **Ingredient level monitoring.**
  - Option A: Software tracking (subtract dispensed amounts from known bottle volumes).
  - Option B: Load cells under each bottle for physical measurement.
  - Display levels in the UI. Alert when a bottle is low or empty.

- [ ] **Fan / diffuser attachment.**
  - Mount a small fan above the mixing vessel to waft the scent toward the user.
  - Alternatively, use an ultrasonic diffuser or nebulizer for better dispersion of volatile compounds.
  - This matters for demos and for evaluating scents without picking up the vessel.

- [ ] **Feedback loop in the UI.**
  - After smelling, the user rates the result: accuracy (1-5), pleasantness (1-5), and free-text notes.
  - Store ratings in Supabase alongside the formula.
  - Use accumulated ratings to fine-tune the system prompt or (eventually) fine-tune a model.

- [ ] **Multi-user support.**
  - User accounts with personal formula libraries.
  - Shared / public formula gallery ("top-rated scents this week").
  - User-submitted ingredient palettes (someone with different stock can still use the system).

- [ ] **Hardware kit for sale.**
  - Package the electronics, tubing, and pump mount as a kit.
  - Sell on Tindie, Etsy, or a dedicated site.
  - Include a getting-started guide and pre-flashed Arduino.
  - Target price: $150-200 for the hardware kit (ingredients sold separately).

- [ ] **API platform.**
  - Expose the scent generation (and optionally dispensing) as an API.
  - Third-party developers could build apps on top: scent-enabled games, ambient scent for VR, scent-based art installations.
  - Pricing: per-generation fee for API calls, per-unit licensing for hardware integration.

---

## Summary of Costs by Phase

| Phase | Cost | Time |
|---|---|---|
| Phase 1: Software | $0 (free tiers) | 1-2 days |
| Phase 2: Ingredients | $150-300 | 1-2 weeks (shipping) |
| Phase 3: Manual testing | $40-60 (lab equipment) | 2-4 weeks |
| Phase 4: Hardware | $125-220 | 1-2 weekends |
| Phase 5: Integration | $0 (software only) | 1-2 days |
| Phase 6: Polish | Varies | Ongoing |
| **Total to full working prototype** | **$315-580** | **6-10 weeks** |

---

## Key Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| AI generates bad formulas | High initially | Phase 3 manual testing catches this early. Constrain the ingredient palette and add concentration limits. |
| Pump calibration drift | Medium | Re-calibrate monthly. Use consistent tubing lengths. |
| Ingredient degradation | Low-Medium | Store properly (amber glass, cool, dark). Rotate stock. Citrus oils degrade fastest -- use within 6 months. |
| Cross-contamination between scents | Medium | Cleaning cycle with carrier solvent between dispenses. Dedicated tubing per ingredient (no shared lines). |
| User safety (skin contact, allergic reactions) | Low | Scents are for smelling, not skin application. Include disclaimers. Provide SDS sheets. |

---

## File Map

Key files in this project and what they do:

```
PromptAndSmell/
  ROADMAP.md              -- This file. Project plan and phases.
  app/                    -- Next.js web application (UI and API routes).
  spec/                   -- Project specification and database schema.
  hardware/
    SHOPPING_LIST.md      -- What to buy (ingredients, equipment, electronics).
    wiring.md             -- How to wire the Arduino, pumps, and MOSFET boards.
    firmware/             -- Arduino code for controlling the pumps.
    ingredient_map.json   -- Maps ingredient names to pump channel numbers.
    calibration.py        -- Script to calibrate pump flow rates.
    controller.py         -- Python script that sends dispense commands to Arduino.
    protocol.py           -- Serial protocol definition for Arduino communication.
    config.py             -- Configuration (serial port, baud rate, etc.).
    requirements.txt      -- Python dependencies for the controller.
```
