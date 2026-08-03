export type ShutdownSignal = "SIGINT" | "SIGTERM";

export function onceAsync(task: () => Promise<void>): () => Promise<void> {
  let completion: Promise<void> | undefined;
  return () => completion ??= task();
}

export function createGracefulSignalHandler(
  release: () => Promise<void>,
  terminate: (code: number) => void
): (signal: ShutdownSignal) => void {
  let handling = false;
  return (signal) => {
    if (handling) return;
    handling = true;
    const code = signal === "SIGINT" ? 130 : 143;
    void release().then(
      () => terminate(code),
      () => terminate(1)
    );
  };
}

export function installGracefulShutdown(
  release: () => Promise<void>
): () => void {
  const handler = createGracefulSignalHandler(
    release,
    (code) => process.exit(code)
  );
  const onInterrupt = () => handler("SIGINT");
  const onTerminate = () => handler("SIGTERM");
  process.once("SIGINT", onInterrupt);
  process.once("SIGTERM", onTerminate);
  return () => {
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
  };
}
