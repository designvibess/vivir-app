export interface STTResult {
  transcript: string;
  confidence: number;
  // Azure phoneme-level pronunciation assessment (null when using Whisper fallback)
  pronunciationScores: PronunciationScores | null;
  durationMs: number;
  provider: "azure" | "whisper" | "mock";
}

export interface PronunciationScores {
  accuracyScore: number;      // 0-100
  fluencyScore: number;       // 0-100
  completenessScore: number;  // 0-100
  pronunciationScore: number; // 0-100, overall
  // Per-word breakdown
  words: WordScore[];
}

export interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: "None" | "Omission" | "Insertion" | "Mispronunciation";
}

export interface STTOptions {
  locale?: string;            // default: "es-ES"
  enablePronunciation?: boolean;  // default: true (Azure only)
  referenceText?: string;     // for pronunciation assessment against a target
}

export interface STTProvider {
  /**
   * Transcribe audio buffer (WAV or WebM). Returns transcript and optional
   * pronunciation scores (Azure only).
   */
  transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<STTResult>;

  /**
   * Verify the provider is reachable. Throws on failure.
   */
  healthCheck(): Promise<{ ok: boolean; latencyMs: number }>;
}
