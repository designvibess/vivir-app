import type { TTSProvider, TTSSynthesisOptions, TTSSynthesisResult } from "./types";

export class MockTTSProvider implements TTSProvider {
  async synthesise(
    _text: string,
    _options?: TTSSynthesisOptions
  ): Promise<TTSSynthesisResult> {
    // Return a tiny valid MP3 header so downstream code doesn't choke
    const silenceBuffer = Buffer.alloc(128, 0);
    return { audioBuffer: silenceBuffer, durationMs: 5, provider: "mock" };
  }

  async *stream(
    _text: string,
    _options?: TTSSynthesisOptions
  ): AsyncGenerator<Buffer> {
    yield Buffer.alloc(128, 0);
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    return { ok: true, latencyMs: 0 };
  }
}
