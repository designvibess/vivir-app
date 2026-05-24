import type {
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIProvider,
  AIStreamChunk,
} from "./types";

export class MockAIProvider implements AIProvider {
  private response: string;

  constructor(response = "Mock AI response for testing.") {
    this.response = response;
  }

  async complete(
    _messages: AIMessage[],
    _options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    return {
      content: this.response,
      inputTokens: 10,
      outputTokens: 5,
      model: "mock",
    };
  }

  async *stream(
    _messages: AIMessage[],
    _options?: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    const words = this.response.split(" ");
    for (const word of words) {
      yield { delta: word + " ", done: false };
    }
    yield { delta: "", done: true };
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    return { ok: true, latencyMs: 0 };
  }
}
