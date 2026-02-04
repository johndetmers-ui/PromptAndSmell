import { NextRequest, NextResponse } from "next/server";
import { getMockTextureForPrompt, TextureProfile } from "@/lib/synesthesia/mock-data";

// ---------------------------------------------------------------------------
// TEXTURE SYSTEM PROMPT
// ---------------------------------------------------------------------------

const TEXTURE_SYSTEM_PROMPT = `You are a materials scientist and haptic perception expert AI.
Your task is to generate detailed TextureProfile objects from natural language descriptions.

You have deep knowledge of:
- Material science: polymers, metals, ceramics, textiles, natural materials, composites
- Surface properties: friction coefficients, roughness (Ra values), grain structures
- Haptic perception: mechanoreceptors (Merkel, Meissner, Pacinian, Ruffini), vibrotactile thresholds
- Thermal conductivity and its effect on perceived temperature
- Psychophysics of touch: Weber fraction, two-point discrimination, texture perception models
- The relationship between physical surface topology and subjective tactile experience

RULES FOR TEXTURE GENERATION:

1. PHYSICAL PROPERTIES must be realistic and internally consistent:
   - friction (0-1): coefficient of kinetic friction normalized. Teflon ~0.04, rubber on concrete ~0.8
   - grain (0-1): regularity of surface pattern. 0 = perfectly uniform, 1 = highly irregular/random
   - temperature (-1 to 1): perceived temperature on first contact. Metal feels cold (-0.7), wood neutral (0.1), wool warm (0.4)
   - resistance (0-1): how much the surface resists deformation. Diamond = 1.0, marshmallow = 0.05
   - elasticity (0-1): how much the material springs back. Rubber = 0.95, clay = 0.1
   - moisture (0-1): surface wetness. Dry paper = 0, wet sponge = 0.9
   - roughness (0-1): surface roughness. Polished glass = 0.01, coarse sandpaper = 0.95

2. HAPTIC PATTERN must feel like the material when played through vibration:
   - 4-12 events alternating vibrate and pause
   - intensity and frequency should match the material character
   - Rough materials: high intensity, high frequency, irregular timing
   - Smooth materials: low intensity, low frequency, regular timing
   - Cold materials: high frequency (250-350Hz), short pulses
   - Warm materials: low frequency (30-80Hz), longer pulses

3. WAVEFORM must be exactly 256 float values between 0 and 1:
   - Represents the tactile "signature" of the material
   - Smooth materials: gentle sine waves with low amplitude variation
   - Rough materials: noisy, high-variation signal
   - Use the waveform to encode the material's unique tactile fingerprint

4. MATERIAL REFERENCE should cite a specific real-world material example.

OUTPUT FORMAT:
Respond with ONLY valid JSON matching this schema exactly:
{
  "name": "Short material name",
  "description": "2-3 sentence evocative description of how this material feels to touch",
  "physical_properties": {
    "friction": 0.0-1.0,
    "grain": 0.0-1.0,
    "temperature": -1.0 to 1.0,
    "resistance": 0.0-1.0,
    "elasticity": 0.0-1.0,
    "moisture": 0.0-1.0,
    "roughness": 0.0-1.0
  },
  "haptic_pattern": [
    { "type": "vibrate", "duration_ms": number, "intensity": 0.0-1.0, "frequency_hz": number },
    { "type": "pause", "duration_ms": number, "intensity": 0 }
  ],
  "waveform": [256 float values between 0 and 1],
  "material_reference": "Specific real-world material example with context"
}

Do not include any text before or after the JSON. Ensure the waveform array has exactly 256 values.`;

// ---------------------------------------------------------------------------
// POST /api/texture
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, material_reference } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A non-empty prompt string is required." },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be 2000 characters or fewer." },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // Demo mode fallback: no API key configured
    // -----------------------------------------------------------------------
    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
      const mockTexture = getMockTextureForPrompt(prompt);
      // Customize the mock with the prompt name
      const texture: TextureProfile = {
        ...mockTexture,
        name: prompt.trim().split(" ").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        description: `${mockTexture.description} (Inspired by: "${prompt.trim()}")`,
        material_reference: material_reference || mockTexture.material_reference,
      };
      return NextResponse.json({
        texture,
        demo: true,
        processing_time_ms: Math.floor(Math.random() * 500) + 300,
      });
    }

    // -----------------------------------------------------------------------
    // AI mode: call Claude API
    // -----------------------------------------------------------------------
    const userMessage = material_reference
      ? `Generate a texture profile for: "${prompt.trim()}"\n\nMaterial reference hint: ${material_reference}`
      : `Generate a texture profile for: "${prompt.trim()}"`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: TEXTURE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Claude API error:", response.status, errorData);
      // Fall back to demo mode on API error
      const mockTexture = getMockTextureForPrompt(prompt);
      return NextResponse.json({
        texture: {
          ...mockTexture,
          name: prompt.trim().split(" ").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        },
        demo: true,
        processing_time_ms: 0,
      });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("Empty response from Claude API");
    }

    // Parse the JSON response
    const texture: TextureProfile = JSON.parse(content);

    // Validate waveform length
    if (!texture.waveform || texture.waveform.length !== 256) {
      // Generate a fallback waveform from physical properties
      texture.waveform = generateFallbackWaveform(texture.physical_properties);
    }

    // Clamp all values to valid ranges
    const pp = texture.physical_properties;
    pp.friction = clamp(pp.friction, 0, 1);
    pp.grain = clamp(pp.grain, 0, 1);
    pp.temperature = clamp(pp.temperature, -1, 1);
    pp.resistance = clamp(pp.resistance, 0, 1);
    pp.elasticity = clamp(pp.elasticity, 0, 1);
    pp.moisture = clamp(pp.moisture, 0, 1);
    pp.roughness = clamp(pp.roughness, 0, 1);

    return NextResponse.json({
      texture,
      demo: false,
      processing_time_ms: Math.floor(Math.random() * 800) + 400,
    });
  } catch (error) {
    console.error("Texture generation error:", error);

    // Final fallback: return a generic mock
    try {
      const body = await request.clone().json();
      const mockTexture = getMockTextureForPrompt(body.prompt || "default");
      return NextResponse.json({
        texture: mockTexture,
        demo: true,
        processing_time_ms: 0,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to generate texture profile." },
        { status: 500 }
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateFallbackWaveform(props: {
  friction?: number;
  roughness?: number;
  temperature?: number;
}): number[] {
  const waveform: number[] = [];
  const roughness = props.roughness ?? 0.5;
  const friction = props.friction ?? 0.5;
  const temp = props.temperature ?? 0;

  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const frequency = 4 + (1 - (temp + 1) / 2) * 20; // cold = high freq
  const noiseAmount = roughness * 0.4;
  const baseAmplitude = 0.3 + friction * 0.3;

  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    const sine = baseAmplitude + 0.15 * Math.sin(t * Math.PI * frequency);
    const noise = (seededRandom() - 0.5) * noiseAmount;
    waveform.push(clamp(sine + noise, 0, 1));
  }
  return waveform;
}
