import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type {
  TTSProvider,
  TTSSynthesisOptions,
  TTSSynthesisResult,
} from "./types";

const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "";
const DEFAULT_MODEL = "eleven_multilingual_v2";

export class ElevenLabsProvider implements TTSProvider {
  private client: ElevenLabsClient;

  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  async synthesise(
    text: string,
    options: TTSSynthesisOptions = {}
  ): Promise<TTSSynthesisResult> {
    const voiceId = options.voiceId ?? DEFAULT_VOICE_ID;
    if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID is not set");

    const start = Date.now();

    // convert() returns a ReadableStream<Uint8Array>
    const readableStream = await this.client.textToSpeech.convert(voiceId, {
      text,
      modelId: options.modelId ?? DEFAULT_MODEL,
      voiceSettings: {
        stability: options.stability ?? 0.5,
        similarityBoost: options.similarityBoost ?? 0.75,
        speed: options.speed ?? 1.0,
      },
      outputFormat: "mp3_44100_128",
    });

    const audioBuffer = await readableStreamToBuffer(readableStream);
    return { audioBuffer, durationMs: Date.now() - start, provider: "elevenlabs" };
  }

  async *stream(
    text: string,
    options: TTSSynthesisOptions = {}
  ): AsyncGenerator<Buffer> {
    const voiceId = options.voiceId ?? DEFAULT_VOICE_ID;
    if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID is not set");

    // Use the dedicated streaming endpoint for lower first-chunk latency
    const readableStream = await this.client.textToSpeech.stream(voiceId, {
      text,
      modelId: options.modelId ?? DEFAULT_MODEL,
      voiceSettings: {
        stability: options.stability ?? 0.5,
        similarityBoost: options.similarityBoost ?? 0.75,
        speed: options.speed ?? 1.0,
      },
      outputFormat: "mp3_44100_128",
    });

    yield* readableStreamToAsyncGenerator(readableStream);
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    await this.client.user.get();
    return { ok: true, latencyMs: Date.now() - start };
  }
}

async function readableStreamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

async function* readableStreamToAsyncGenerator(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<Buffer> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield Buffer.from(value);
    }
  } finally {
    reader.releaseLock();
  }
}
