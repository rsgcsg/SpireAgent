import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { acquireRuntimeLock } from "../src/runtime/runtimeLock.js";

describe("acquireRuntimeLock", () => {
  it("permits one action-capable runtime at a time and releases cleanly", async () => {
    const root = await mkdtemp(join(tmpdir(), "re-spire-agent-lock-"));
    const first = await acquireRuntimeLock(root);
    await expect(acquireRuntimeLock(root)).rejects.toThrow("Another RE-P1 runtime holds");
    await first.release();
    const second = await acquireRuntimeLock(root);
    await second.release();
  });
});
