import type { STTOptions, STTProvider, STTResult } from "./types";

export class MockSTTProvider implements STTProvider {
  private fixedTranscript: string;

  constructor(fixedTranscript = "Hola, esto es una prueba.") {
    this.fixedTranscript = fixedTranscript;
  }

  async transcribe(_audioBuffer: Buffer, _options?: STTOptions): Promise<STTResult> {
    return {
      transcript: this.fixedTranscript,
      confidence: 0.99,
      pronunciationScores: {
        accuracyScore: 85,
        fluencyScore: 90,
        completenessScore: 100,
        pronunciationScore: 88,
        words: this.fixedTranscript.split(" ").map((word) => ({
          word,
          accuracyScore: 85,
          errorType: "None",
        })),
      },
      durationMs: 50,
      provider: "mock",
    };
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    return { ok: true, latencyMs: 0 };
  }
}
