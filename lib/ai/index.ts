export type { AIProvider, AIMessage, AICompletionOptions, AICompletionResult, AIStreamChunk } from "./types";
export { AnthropicProvider } from "./anthropic";
export { MockAIProvider } from "./mock";

import { AnthropicProvider } from "./anthropic";
import { MockAIProvider } from "./mock";
import type { AIProvider } from "./types";

export function getAIProvider(variant: "quality" | "fast" = "quality"): AIProvider {
  if (process.env.NODE_ENV === "test" || process.env.USE_MOCK_AI === "true") {
    return new MockAIProvider();
  }
  return new AnthropicProvider(variant);
}

// Singleton instances for runtime use
export const ai = {
  quality: new AnthropicProvider("quality"),
  fast: new AnthropicProvider("fast"),
} as const;
