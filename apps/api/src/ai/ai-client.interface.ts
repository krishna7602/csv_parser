import type { RawRecord } from "@groweasy/shared";

/**
 * Swap-able LLM client interface.
 * Implement AnthropicClient, OpenAiClient, GeminiClient, or StubClient
 * — ai-extraction.service never imports a concrete class.
 */
export interface ILLMClient {
  /**
   * Extract structured CRM records from a batch of raw CSV rows.
   * Returns raw parsed JSON (unknown[]) — validation is the caller's responsibility.
   *
   * @param rows - Batch of raw CSV rows (original headers intact)
   * @param headers - All CSV column headers from the original file
   * @returns Array of unknown objects (length === rows.length, same order)
   */
  extractBatch(rows: RawRecord[], headers: string[]): Promise<unknown[]>;
}
