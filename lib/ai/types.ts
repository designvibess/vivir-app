export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface AICompletionResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface AIStreamChunk {
  delta: string;
  done: boolean;
}

export interface AIProvider {
  /**
   * Non-streaming completion. Returns the full response once done.
   */
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;

  /**
   * Streaming completion. Yields text deltas as they arrive.
   */
  stream(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk>;

  /**
   * Verify the provider is reachable. Throws on failure.
   */
  healthCheck(): Promise<{ ok: boolean; latencyMs: number }>;
}
