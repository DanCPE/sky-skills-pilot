import { promises as fs } from "fs";
import path from "path";
import type { BroadcastInput, BroadcastSettings } from "@/types/broadcast";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "broadcast.json");

const defaultBroadcastSettings: BroadcastSettings = {
  phrase: "",
  updatedAt: new Date(0).toISOString(),
};

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(
      dataFile,
      `${JSON.stringify(defaultBroadcastSettings, null, 2)}\n`,
      "utf8",
    );
  }
}

export async function readBroadcastSettings() {
  await ensureDataFile();

  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<BroadcastSettings>;

  return {
    ...defaultBroadcastSettings,
    ...parsed,
    phrase: typeof parsed.phrase === "string" ? parsed.phrase : "",
    updatedAt:
      typeof parsed.updatedAt === "string"
        ? parsed.updatedAt
        : defaultBroadcastSettings.updatedAt,
  };
}

export async function updateBroadcastSettings(input: Partial<BroadcastInput>) {
  const phrase = input.phrase?.trim() ?? "";
  const nextSettings: BroadcastSettings = {
    phrase,
    updatedAt: new Date().toISOString(),
  };

  await ensureDataFile();
  await fs.writeFile(
    dataFile,
    `${JSON.stringify(nextSettings, null, 2)}\n`,
    "utf8",
  );

  return nextSettings;
}
