import { describe, expect, it, vi } from "vitest";
import {
  createGracefulSignalHandler,
  onceAsync
} from "../src/app/gracefulShutdown.js";

describe("graceful runtime shutdown", () => {
  it("runs controller and lock release at most once", async () => {
    const task = vi.fn(async () => undefined);
    const release = onceAsync(task);

    await Promise.all([release(), release(), release()]);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("releases before terminating and ignores repeated signals", async () => {
    const order: string[] = [];
    const handler = createGracefulSignalHandler(
      async () => { order.push("release"); },
      (code) => { order.push(`exit:${code}`); }
    );

    handler("SIGINT");
    handler("SIGTERM");
    await Promise.resolve();

    expect(order).toEqual(["release", "exit:130"]);
  });
});
