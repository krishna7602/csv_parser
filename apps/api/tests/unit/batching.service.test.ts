import { describe, it, expect } from "vitest";
import { chunkIntoBatches, getBatchStartIndex } from "../../src/services/batching.service.js";
import type { RawRecord } from "@groweasy/shared";

function makeRows(n: number): RawRecord[] {
  return Array.from({ length: n }, (_, i) => ({ id: String(i) }));
}

describe("chunkIntoBatches", () => {
  it("splits evenly divisible rows into correct number of batches", () => {
    const batches = chunkIntoBatches(makeRows(60), 20);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(20);
    expect(batches[2]).toHaveLength(20);
  });

  it("handles a remainder batch", () => {
    const batches = chunkIntoBatches(makeRows(45), 20);
    expect(batches).toHaveLength(3);
    expect(batches[2]).toHaveLength(5);
  });

  it("returns single batch when rows < batchSize", () => {
    const batches = chunkIntoBatches(makeRows(10), 20);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(10);
  });

  it("returns empty array for empty input", () => {
    expect(chunkIntoBatches([], 20)).toEqual([]);
  });

  it("throws when batchSize < 1", () => {
    expect(() => chunkIntoBatches(makeRows(5), 0)).toThrow();
  });

  it("each batch contains exactly the right rows", () => {
    const rows = makeRows(5);
    const batches = chunkIntoBatches(rows, 2);
    expect(batches[0]).toEqual([{ id: "0" }, { id: "1" }]);
    expect(batches[1]).toEqual([{ id: "2" }, { id: "3" }]);
    expect(batches[2]).toEqual([{ id: "4" }]);
  });
});

describe("getBatchStartIndex", () => {
  it("returns correct start index for each batch", () => {
    expect(getBatchStartIndex(0, 20)).toBe(0);
    expect(getBatchStartIndex(1, 20)).toBe(20);
    expect(getBatchStartIndex(2, 20)).toBe(40);
  });
});
