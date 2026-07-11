import { describe, it, expect, vi } from "vitest";
import { retry } from "../../src/utils/retry.js";

describe("retry", () => {
  it("returns the result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await retry(fn, { attempts: 3, backoffMs: [1, 1, 1] });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on 2nd attempt", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValue("success");

    const result = await retry(fn, { attempts: 3, backoffMs: [1, 1, 1] });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after all attempts are exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    await expect(
      retry(fn, { attempts: 3, backoffMs: [1, 1, 1] })
    ).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry callback with attempt number", async () => {
    const onRetry = vi.fn();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    await retry(fn, { attempts: 3, backoffMs: [1, 1, 1], onRetry });
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it("does not retry if attempts = 1", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(retry(fn, { attempts: 1, backoffMs: [1] })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
