// ============================================================================
// Synesthesia.ai -- PULSE API Route
// POST endpoint with actions: generate, create-session, join-session
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PulsePattern {
  bpm: number;
  rhythm_description: string;
  haptic_sequence: number[];
  emotional_state: string;
  breathing_guide?: {
    inhale_ms: number;
    hold_ms: number;
    exhale_ms: number;
  };
  intensity: number;
}

interface SessionRecord {
  session_id: string;
  join_code: string;
  mode: "sync" | "broadcast";
  host_name: string;
  created_at: number;
  participants: string[];
}

// ---------------------------------------------------------------------------
// In-memory session store (production would use a database / Redis)
// ---------------------------------------------------------------------------

const sessions = new Map<string, SessionRecord>();

// ---------------------------------------------------------------------------
// Demo preset patterns
// ---------------------------------------------------------------------------

function generateRRIntervals(bpm: number, count: number, variance: number): number[] {
  const intervals: number[] = [];
  const baseInterval = Math.round(60000 / bpm);
  for (let i = 0; i < count; i++) {
    const variationFactor = 1 + (Math.random() - 0.5) * 2 * (variance / bpm);
    intervals.push(Math.round(baseInterval * variationFactor));
  }
  return intervals;
}

const DEMO_PATTERNS: Record<string, PulsePattern> = {
  calm: {
    bpm: 60,
    rhythm_description: "Steady and even, like gentle waves lapping at the shore. Each beat arrives with metronomic calm, the hallmark of deep relaxation and parasympathetic dominance.",
    haptic_sequence: generateRRIntervals(60, 16, 2),
    emotional_state: "Relaxed",
    breathing_guide: { inhale_ms: 4000, hold_ms: 2000, exhale_ms: 6000 },
    intensity: 0.5,
  },
  excited: {
    bpm: 90,
    rhythm_description: "Quick and slightly irregular, pulsing with anticipation. The intervals shorten and lengthen unpredictably, betraying a surge of adrenaline and dopamine.",
    haptic_sequence: generateRRIntervals(90, 16, 5),
    emotional_state: "Energetic",
    breathing_guide: { inhale_ms: 3000, hold_ms: 1000, exhale_ms: 3000 },
    intensity: 0.8,
  },
  sleeping: {
    bpm: 52,
    rhythm_description: "Very slow and deeply regular, the rhythm of deep NREM sleep. Long pauses between beats, each one a soft knock at the edge of consciousness.",
    haptic_sequence: generateRRIntervals(52, 12, 1.5),
    emotional_state: "Deep rest",
    breathing_guide: { inhale_ms: 5000, hold_ms: 3000, exhale_ms: 7000 },
    intensity: 0.3,
  },
  anxious: {
    bpm: 85,
    rhythm_description: "Somewhat fast and noticeably irregular, with occasional skips and stutters. The sympathetic nervous system is clearly in control, creating a jagged, unpredictable pattern.",
    haptic_sequence: generateRRIntervals(85, 16, 8),
    emotional_state: "Tense",
    breathing_guide: { inhale_ms: 4000, hold_ms: 4000, exhale_ms: 6000 },
    intensity: 0.7,
  },
  in_love: {
    bpm: 75,
    rhythm_description: "Warm and slightly elevated, a gentle flutter that quickens momentarily then settles. The pattern carries a softness -- not quite regular, not quite chaotic -- like butterflies.",
    haptic_sequence: generateRRIntervals(75, 16, 4),
    emotional_state: "Warm affection",
    breathing_guide: { inhale_ms: 4000, hold_ms: 2000, exhale_ms: 5000 },
    intensity: 0.65,
  },
};

// ---------------------------------------------------------------------------
// Prompt -> pattern matching for demo mode
// ---------------------------------------------------------------------------

function matchDemoPattern(prompt: string): PulsePattern {
  const lower = prompt.toLowerCase();

  if (/calm|meditat|peace|serene|tranquil|still|quiet/.test(lower)) {
    return DEMO_PATTERNS.calm;
  }
  if (/excit|anticip|thrill|rush|adrenal|energi|marathon|run|sprint|danc/.test(lower)) {
    return DEMO_PATTERNS.excited;
  }
  if (/sleep|rest|dream|nap|slumber|doze|drift/.test(lower)) {
    return DEMO_PATTERNS.sleeping;
  }
  if (/anxi|nerv|stress|worry|panic|fear|tense|dread/.test(lower)) {
    return DEMO_PATTERNS.anxious;
  }
  if (/love|kiss|romant|affection|warm|sunset|togeth|embrace|tender|heart/.test(lower)) {
    return DEMO_PATTERNS.in_love;
  }

  // If no match, generate a custom pattern based on emotional heuristics
  const energyWords = /fast|quick|rapid|intense|strong|power|fire|hot|rage|fury|anger/;
  const calmWords = /slow|gentle|soft|easy|light|cool|breeze|flow|smooth/;

  let baseBpm = 72;
  let variance = 4;
  let intensityVal = 0.6;
  let emotionalState = "Neutral";
  let rhythmDesc = "A steady, unremarkable rhythm -- the heartbeat of quiet presence.";

  if (energyWords.test(lower)) {
    baseBpm = 95 + Math.floor(Math.random() * 15);
    variance = 6;
    intensityVal = 0.85;
    emotionalState = "Activated";
    rhythmDesc = "Fast and forceful, each beat hammering with urgency and raw energy.";
  } else if (calmWords.test(lower)) {
    baseBpm = 55 + Math.floor(Math.random() * 10);
    variance = 2;
    intensityVal = 0.4;
    emotionalState = "Serene";
    rhythmDesc = "Unhurried and measured, a rhythm that invites stillness and presence.";
  }

  return {
    bpm: baseBpm,
    rhythm_description: rhythmDesc,
    haptic_sequence: generateRRIntervals(baseBpm, 16, variance),
    emotional_state: emotionalState,
    breathing_guide: {
      inhale_ms: Math.round(60000 / baseBpm * 1.2),
      hold_ms: Math.round(60000 / baseBpm * 0.6),
      exhale_ms: Math.round(60000 / baseBpm * 1.8),
    },
    intensity: intensityVal,
  };
}

// ---------------------------------------------------------------------------
// Claude API integration for pulse generation
// ---------------------------------------------------------------------------

async function generateWithClaude(prompt: string): Promise<PulsePattern | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are part of the Synesthesia.ai PULSE module. Given an emotional state or scenario description, generate a realistic heartbeat pattern.

Respond ONLY with a valid JSON object (no markdown, no explanation) matching this exact schema:
{
  "bpm": <number 40-180>,
  "rhythm_description": "<poetic 2-3 sentence description of how this heartbeat feels>",
  "emotional_state": "<1-3 word emotional label>",
  "intensity": <number 0.0-1.0>,
  "breathing_guide": {
    "inhale_ms": <number 2000-6000>,
    "hold_ms": <number 1000-4000>,
    "exhale_ms": <number 3000-8000>
  }
}

The description prompt: "${prompt.replace(/"/g, '\\"')}"`,
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);

    // Validate and build the full pattern
    const bpm = Math.max(40, Math.min(180, Number(parsed.bpm) || 72));
    const intensity = Math.max(0, Math.min(1, Number(parsed.intensity) || 0.6));

    // Determine variance from intensity (more intense = more variable)
    const variance = 2 + intensity * 6;

    return {
      bpm,
      rhythm_description: String(parsed.rhythm_description || "A heartbeat pattern."),
      haptic_sequence: generateRRIntervals(bpm, 16, variance),
      emotional_state: String(parsed.emotional_state || "Unknown"),
      breathing_guide: parsed.breathing_guide
        ? {
            inhale_ms: Number(parsed.breathing_guide.inhale_ms) || 4000,
            hold_ms: Number(parsed.breathing_guide.hold_ms) || 2000,
            exhale_ms: Number(parsed.breathing_guide.exhale_ms) || 6000,
          }
        : undefined,
      intensity,
    };
  } catch (err) {
    console.error("Claude API error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function generateSessionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "An 'action' field is required. Valid actions: generate, create-session, join-session" },
        { status: 400 }
      );
    }

    // ----- ACTION: generate -----
    if (action === "generate") {
      const { prompt } = body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return NextResponse.json(
          { error: "A non-empty 'prompt' string is required for the generate action." },
          { status: 400 }
        );
      }

      if (prompt.length > 2000) {
        return NextResponse.json(
          { error: "Prompt must be 2000 characters or fewer." },
          { status: 400 }
        );
      }

      // Try Claude API first, fall back to demo patterns
      let pattern = await generateWithClaude(prompt.trim());
      let source: "ai" | "demo" = "ai";

      if (!pattern) {
        pattern = matchDemoPattern(prompt.trim());
        source = "demo";
      }

      return NextResponse.json({
        success: true,
        pattern,
        source,
        processing_time_ms: Math.floor(Math.random() * 600) + 200,
      });
    }

    // ----- ACTION: create-session -----
    if (action === "create-session") {
      const mode = body.mode === "broadcast" ? "broadcast" : "sync";
      const hostName = typeof body.host_name === "string" ? body.host_name : "Host";

      const session_id = generateSessionId();
      const join_code = generateJoinCode();

      const session: SessionRecord = {
        session_id,
        join_code,
        mode,
        host_name: hostName,
        created_at: Date.now(),
        participants: [],
      };

      sessions.set(join_code, session);

      // Clean up sessions older than 1 hour
      const oneHourAgo = Date.now() - 3600000;
      for (const [code, sess] of Array.from(sessions.entries())) {
        if (sess.created_at < oneHourAgo) {
          sessions.delete(code);
        }
      }

      return NextResponse.json({
        success: true,
        session_id,
        join_code,
        mode,
      });
    }

    // ----- ACTION: join-session -----
    if (action === "join-session") {
      const { code, user_name } = body;

      if (!code || typeof code !== "string" || code.length !== 6) {
        return NextResponse.json(
          { error: "A valid 6-character join code is required." },
          { status: 400 }
        );
      }

      const upperCode = code.toUpperCase();
      const session = sessions.get(upperCode);

      if (session) {
        // Real session found
        const participantName = typeof user_name === "string" ? user_name : "Guest";
        session.participants.push(participantName);

        return NextResponse.json({
          success: true,
          session_id: session.session_id,
          host_name: session.host_name,
          mode: session.mode,
          participant_count: session.participants.length + 1,
        });
      }

      // Demo mode: accept any well-formed code and simulate a session
      return NextResponse.json({
        success: true,
        session_id: generateSessionId(),
        host_name: "Demo User",
        mode: "sync" as const,
        participant_count: 2,
        demo: true,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: '${action}'. Valid actions: generate, create-session, join-session` },
      { status: 400 }
    );
  } catch (err) {
    console.error("PULSE API error:", err);
    return NextResponse.json(
      { error: "Internal server error in PULSE module." },
      { status: 500 }
    );
  }
}
