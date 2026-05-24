export type { STTProvider, STTResult, STTOptions, PronunciationScores, WordScore } from "./types";
export { AzureSpeechProvider } from "./azure";
export { MockSTTProvider } from "./mock";

import { AzureSpeechProvider } from "./azure";
import { MockSTTProvider } from "./mock";
import type { STTProvider } from "./types";

export function getSTTProvider(): STTProvider {
  if (process.env.NODE_ENV === "test" || process.env.USE_MOCK_STT === "true") {
    return new MockSTTProvider();
  }
  return new AzureSpeechProvider();
}

export const stt = new AzureSpeechProvider();
