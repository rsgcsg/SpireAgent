import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

interface LockPayload {
  pid: number;
  startedAt: string;
}

export interface RuntimeLock {
  release(): Promise<void>;
}

export async function acquireRuntimeLock(dataRoot: string, pid = process.pid): Promise<RuntimeLock> {
  const lockPath = join(resolve(dataRoot), ".active-runtime.lock");
  await mkdir(resolve(dataRoot), { recursive: true });
  const payload: LockPayload = { pid, startedAt: new Date().toISOString() };

  try {
    await writeFile(lockPath, `${JSON.stringify(payload)}\n`, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
    const existing = await readLock(lockPath);
    if (existing && !isProcessAlive(existing.pid)) {
      await unlink(lockPath).catch(() => undefined);
      return acquireRuntimeLock(dataRoot, pid);
    }
    const owner = existing ? `pid ${existing.pid}, started ${existing.startedAt}` : "an unreadable existing lock";
    throw new Error(`Another RE-P1 runtime holds ${lockPath} (${owner}). Stop it before starting another action-capable process.`);
  }

  let released = false;
  return {
    async release(): Promise<void> {
      if (released) return;
      released = true;
      await unlink(lockPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  };
}

async function readLock(path: string): Promise<LockPayload | undefined> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as unknown;
    if (!isLockPayload(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function isLockPayload(value: unknown): value is LockPayload {
  return typeof value === "object" && value !== null
    && typeof (value as LockPayload).pid === "number"
    && typeof (value as LockPayload).startedAt === "string";
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: unknown) {
    return !(error instanceof Error && "code" in error && error.code === "ESRCH");
  }
}

function isAlreadyExists(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}
