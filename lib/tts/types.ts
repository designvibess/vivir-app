export interface TTSSynthesisOptions {
  voiceId?: string;
  modelId?: string;
  // 0.0 (fast/robotic) – 1.0 (slow/expressive). Default 0.5
  stability?: number;
  // 0.0 (monotone) – 1.0 (varied). Default 0.75
  similarityBoost?: number;
  // 0.8 = 80% of normal speed. Used for "slow" dialogue version.
  speed?: number;
}

export interface TTSSynthesisResult {
  audioBuffer: Buffer;
  durationMs: number;
  provider: "elevenlabs" | "mock";
}

export interface TTSProvider {
  /**
   * Synthesise text to audio. Returns a Buffer containing MP3 audio.
   */
  synthesise(text: string, options?: TTSSynthesisOptions): Promise<TTSSynthesisResult>;

  /**
   * Streaming synthesis — yields MP3 chunks as they arrive. Lower latency for
   * long texts (Profesora replies during Conversaciones).
   */
  stream(text: string, options?: TTSSynthesisOptions): AsyncGenerator<Buffer>;

  /**
   * Verify the provider is reachable. Throws on failure.
   */
  healthCheck(): Promise<{ ok: boolean; latencyMs: number }>;
}
