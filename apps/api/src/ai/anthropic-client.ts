import Anthropic from "@anthropic-ai/sdk";
import type { RawRecord } from "@groweasy/shared";
import type { ILLMClient } from "./ai-client.interface.js";
import { buildSystemPrompt, buildUserMessage } from "./prompts/crm-extraction.prompt.js";
import { logger } from "../utils/logger.js";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

/**
 * Anthropic Claude implementation of ILLMClient.
 * Swap with OpenAiClient or GeminiClient by implementing ILLMClient.
 */
export class AnthropicClient implements ILLMClient {
  private readonly client: Anthropic;
  private readonly systemPrompt: string;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
    this.systemPrompt = buildSystemPrompt();
  }

  async extractBatch(rows: RawRecord[], headers: string[]): Promise<unknown[]> {
    const userMessage = buildUserMessage(headers, rows);

    logger.debug("AnthropicClient: sending batch", {
      rowCount: rows.length,
      model: MODEL,
    });

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: this.systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    logger.debug("AnthropicClient: received response", {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      stopReason: response.stop_reason,
    });

    return this.parseJsonResponse(rawText, rows.length);
  }

  /**
   * Defensively parse the AI response, stripping accidental markdown fences.
   */
  private parseJsonResponse(rawText: string, expectedCount: number): unknown[] {
    let text = rawText.trim();

    // Strip markdown code fences if present (e.g. ```json ... ```)
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    text = text.trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(
        `AnthropicClient: failed to parse AI response as JSON. Raw text (first 500 chars): ${text.slice(0, 500)}`
      );
    }

    if (!Array.isArray(parsed)) {
      throw new Error(
        `AnthropicClient: expected JSON array, got ${typeof parsed}`
      );
    }

    if (parsed.length !== expectedCount) {
      logger.warn("AnthropicClient: array length mismatch", {
        expected: expectedCount,
        received: parsed.length,
      });
      // Still return what we got — record-validator will handle per-record issues
    }

    return parsed;
  }
}
