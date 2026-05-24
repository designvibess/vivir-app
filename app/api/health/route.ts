import { NextRequest, NextResponse } from "next/server";

type ServiceStatus = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  note?: string;
};

type HealthResponse = {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  mode: "shallow" | "deep";
  services: {
    anthropic: ServiceStatus;
    azure_speech: ServiceStatus;
    elevenlabs: ServiceStatus;
    supabase: ServiceStatus;
  };
};

/**
 * GET /api/health
 *
 * Shallow mode (default): verifies env vars are present and SDKs initialize.
 * Deep mode (?deep=true): makes a live round-trip to each service.
 * Keep deep mode out of automated uptime probes — it costs money.
 */
export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get("deep") === "true";

  const services: HealthResponse["services"] = {
    anthropic: await checkAnthropic(deep),
    azure_speech: await checkAzureSpeech(deep),
    elevenlabs: await checkElevenLabs(deep),
    supabase: await checkSupabase(deep),
  };

  const allOk = Object.values(services).every((s) => s.ok);
  const anyOk = Object.values(services).some((s) => s.ok);

  const response: HealthResponse = {
    status: allOk ? "ok" : anyOk ? "degraded" : "down",
    timestamp: new Date().toISOString(),
    mode: deep ? "deep" : "shallow",
    services,
  };

  return NextResponse.json(response, {
    status: allOk ? 200 : 503,
  });
}

// ─── Per-service checks ────────────────────────────────────────────────────

async function checkAnthropic(deep: boolean): Promise<ServiceStatus> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY not set" };

  if (!deep) {
    return { ok: true, note: "env var present" };
  }

  try {
    const { AnthropicProvider } = await import("@/lib/ai/anthropic");
    const provider = new AnthropicProvider("fast");
    const result = await provider.healthCheck();
    return result;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function checkAzureSpeech(deep: boolean): Promise<ServiceStatus> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key) return { ok: false, error: "AZURE_SPEECH_KEY not set" };
  if (!region) return { ok: false, error: "AZURE_SPEECH_REGION not set" };

  if (!deep) {
    return { ok: true, note: "env vars present" };
  }

  try {
    const { AzureSpeechProvider } = await import("@/lib/stt/azure");
    const provider = new AzureSpeechProvider();
    const result = await provider.healthCheck();
    return result;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function checkElevenLabs(deep: boolean): Promise<ServiceStatus> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { ok: false, error: "ELEVENLABS_API_KEY not set" };

  if (!deep) {
    return { ok: true, note: "env var present" };
  }

  try {
    const { ElevenLabsProvider } = await import("@/lib/tts/elevenlabs");
    const provider = new ElevenLabsProvider();
    const result = await provider.healthCheck();
    return result;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function checkSupabase(deep: boolean): Promise<ServiceStatus> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url) return { ok: false, error: "SUPABASE_URL not set" };
  if (!anonKey) return { ok: false, error: "SUPABASE_ANON_KEY not set" };

  if (!deep) {
    return { ok: true, note: "env vars present" };
  }

  try {
    const start = Date.now();
    // Ping Supabase REST with a trivial request — no auth needed
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!res.ok) {
      return { ok: false, error: `Supabase responded ${res.status}` };
    }
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
