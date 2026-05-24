export type { TTSProvider, TTSSynthesisOptions, TTSSynthesisResult } from "./types";
export { ElevenLabsProvider } from "./elevenlabs";
export { MockTTSProvider } from "./mock";

import { ElevenLabsProvider } from "./elevenlabs";
import { MockTTSProvider } from "./mock";
import type { TTSProvider } from "./types";

export function getTTSProvider(): TTSProvider {
  if (process.env.NODE_ENV === "test" || process.env.USE_MOCK_TTS === "true") {
    return new MockTTSProvider();
  }
  return new ElevenLabsProvider();
}

export const tts = new ElevenLabsProvider();
