import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const LANG = process.env.STS2_DATA_LANG || "zhs";
const CODEX_BASE_URL = process.env.SPIRE_CODEX_BASE_URL || "https://spire-codex.com";
const OUTPUT_DIR = path.join(projectRoot, "data", "spire-codex");

const ENTITIES = {
  cards: {
    endpoint: "/api/cards",
    file: `cards-${LANG}.json`,
    exportNames: ["cards.json", "cards-zhs.json"]
  },
  relics: {
    endpoint: "/api/relics",
    file: `relics-${LANG}.json`,
    exportNames: ["relics.json", "relics-zhs.json"]
  },
  characters: {
    endpoint: "/api/characters",
    file: `characters-${LANG}.json`,
    exportNames: ["characters.json", "characters-zhs.json"]
  },
  keywords: {
    endpoint: "/api/keywords",
    file: `keywords-${LANG}.json`,
    exportNames: ["keywords.json", "keywords-zhs.json"]
  },
  potions: {
    endpoint: "/api/potions",
    file: `potions-${LANG}.json`,
    exportNames: ["potions.json", "potions-zhs.json"],
    optional: true
  }
};

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const metadata = {
    syncedAt: new Date().toISOString(),
    source: "spire-codex",
    baseUrl: CODEX_BASE_URL,
    language: LANG,
    usedExport: false,
    downloadedEntities: [],
    failedEntities: [],
    retainedFromCache: [],
    files: {},
    notes: []
  };

  const downloaded = new Set();

  try {
    const exportResult = await fetchExport();
    metadata.usedExport = true;
    metadata.exportUrl = exportResult.url;
    const parsed = parseExportPayload(exportResult);

    for (const [entityName, config] of Object.entries(ENTITIES)) {
      const payload = findExportEntity(parsed, config.exportNames);
      if (payload === undefined) {
        metadata.notes.push(`Export did not include ${entityName}; trying entity endpoint.`);
        continue;
      }

      await saveEntity(entityName, payload, metadata);
      downloaded.add(entityName);
    }
  } catch (error) {
    metadata.notes.push(`Full export failed: ${formatError(error)}`);
  }

  for (const [entityName, config] of Object.entries(ENTITIES)) {
    if (downloaded.has(entityName)) {
      continue;
    }

    try {
      const payload = await fetchEntity(config.endpoint);
      await saveEntity(entityName, payload, metadata);
      downloaded.add(entityName);
    } catch (error) {
      const outputPath = path.join(OUTPUT_DIR, config.file);
      const failure = {
        entity: entityName,
        error: formatError(error),
        hasExistingCache: existsSync(outputPath)
      };

      metadata.failedEntities.push(failure);

      if (failure.hasExistingCache) {
        metadata.retainedFromCache.push(entityName);
        metadata.notes.push(`Kept existing cache for ${entityName} after sync failure.`);
      }
    }
  }

  await writeJson(path.join(OUTPUT_DIR, "metadata.json"), metadata);

  const missingRequired = Object.entries(ENTITIES)
    .filter(([entityName, config]) => !config.optional && !downloaded.has(entityName))
    .filter(([entityName, config]) => !existsSync(path.join(OUTPUT_DIR, config.file)))
    .map(([entityName]) => entityName);

  if (missingRequired.length > 0) {
    throw new Error(`Missing required STS2 data after sync: ${missingRequired.join(", ")}`);
  }

  console.log(
    `Synced STS2 data (${LANG}): ${metadata.downloadedEntities.join(", ") || "no new downloads"}`
  );

  if (metadata.failedEntities.length > 0) {
    console.warn(`Some entities failed and were not overwritten:`);
    for (const failure of metadata.failedEntities) {
      console.warn(`- ${failure.entity}: ${failure.error}`);
    }
  }
}

async function fetchExport() {
  const url = `${CODEX_BASE_URL}/api/exports/${encodeURIComponent(LANG)}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/zip, application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const arrayBuffer = await response.arrayBuffer();
  return {
    url,
    contentType,
    buffer: Buffer.from(arrayBuffer)
  };
}

async function fetchEntity(endpoint) {
  const url = new URL(endpoint, CODEX_BASE_URL);
  url.searchParams.set("lang", LANG);

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchWithTimeout(url, options = {}) {
  const timeoutMs = Number(process.env.STS2_DATA_SYNC_TIMEOUT_MS || 30000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseExportPayload(exportResult) {
  const trimmed = exportResult.buffer.subarray(0, 4).toString("binary");
  const looksLikeZip = trimmed.startsWith("PK\u0003\u0004");

  if (looksLikeZip || exportResult.contentType.includes("zip")) {
    const files = extractZipFiles(exportResult.buffer);
    const parsed = {};

    for (const [filename, fileBuffer] of files.entries()) {
      if (!filename.endsWith(".json")) {
        continue;
      }

      parsed[filename] = JSON.parse(fileBuffer.toString("utf8"));
    }

    return parsed;
  }

  const json = JSON.parse(exportResult.buffer.toString("utf8"));
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json;
  }

  return { "export.json": json };
}

function findExportEntity(parsedExport, exportNames) {
  for (const exportName of exportNames) {
    if (Object.hasOwn(parsedExport, exportName)) {
      return parsedExport[exportName];
    }
  }

  for (const [key, value] of Object.entries(parsedExport)) {
    const normalizedKey = normalizeKey(key);
    for (const exportName of exportNames) {
      if (normalizedKey === normalizeKey(exportName.replace(/\.json$/i, ""))) {
        return value;
      }
    }
  }

  return undefined;
}

async function saveEntity(entityName, payload, metadata) {
  const config = ENTITIES[entityName];
  const outputPath = path.join(OUTPUT_DIR, config.file);
  const normalizedPayload = normalizePayload(payload);

  await writeJson(outputPath, normalizedPayload);

  metadata.downloadedEntities.push(entityName);
  metadata.files[entityName] = {
    path: path.relative(projectRoot, outputPath),
    count: Array.isArray(normalizedPayload) ? normalizedPayload.length : null
  };
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    for (const key of ["items", "data", "results", "records"]) {
      if (Array.isArray(payload[key])) {
        return payload[key];
      }
    }
  }

  return payload;
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function extractZipFiles(buffer) {
  const endOfCentralDirectory = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(endOfCentralDirectory + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(endOfCentralDirectory + 16);
  const files = new Map();

  let offset = centralDirectoryOffset;
  for (let i = 0; i < entryCount; i += 1) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x02014b50) {
      throw new Error(`Invalid ZIP central directory signature at offset ${offset}`);
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    const localSignature = buffer.readUInt32LE(localHeaderOffset);
    if (localSignature !== 0x04034b50) {
      throw new Error(`Invalid ZIP local header signature for ${fileName}`);
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    if (!fileName.endsWith("/")) {
      files.set(fileName, decompressZipEntry(compressed, compressionMethod, fileName));
    }

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return files;
}

function findEndOfCentralDirectory(buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error("Could not find ZIP end-of-central-directory record");
}

function decompressZipEntry(compressed, compressionMethod, fileName) {
  if (compressionMethod === 0) {
    return compressed;
  }

  if (compressionMethod === 8) {
    return zlib.inflateRawSync(compressed);
  }

  throw new Error(`Unsupported ZIP compression method ${compressionMethod} for ${fileName}`);
}

function normalizeKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/\.json$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
