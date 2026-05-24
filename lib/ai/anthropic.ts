import Anthropic from "@anthropic-ai/sdk";
import type {
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIProvider,
  AIStreamChunk,
} from "./types";

const QUALITY_MODEL =
  process.env.ANTHROPIC_QUALITY_MODEL ?? "claude-sonnet-4-6";
const FAST_MODEL = process.env.ANTHROPIC_FAST_MODEL ?? "claude-haiku-4-5-20251001";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor(variant: "quality" | "fast" = "quality") {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.defaultModel = variant === "quality" ? QUALITY_MODEL : FAST_MODEL;
  }

  async complete(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletionResult> {
    const system = options.systemPrompt;
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: options.model ?? this.defaultModel,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature,
      system,
      messages: anthropicMessages,
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
    };
  }

  async *stream(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): AsyncGenerator<AIStreamChunk> {
    const system = options.systemPrompt;
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const stream = this.client.messages.stream({
      model: options.model ?? this.defaultModel,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature,
      system,
      messages: anthropicMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { delta: event.delta.text, done: false };
      }
    }

    yield { delta: "", done: true };
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    await this.client.messages.create({
      model: FAST_MODEL,
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
    return { ok: true, latencyMs: Date.now() - start };
  }
}
