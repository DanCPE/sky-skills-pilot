import { promises as fs } from "fs";
import path from "path";
import type { FreeResource, FreeResourceInput } from "@/types/free-resource";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "free-resources.json");

function createId(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

  return `${slug || "resource"}-${Date.now().toString(36)}`;
}

function sortResources(resources: FreeResource[]) {
  return [...resources].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

export async function readFreeResources() {
  await ensureDataFile();

  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as FreeResource[];
  return sortResources(parsed);
}

async function writeFreeResources(resources: FreeResource[]) {
  await ensureDataFile();
  await fs.writeFile(
    dataFile,
    `${JSON.stringify(sortResources(resources), null, 2)}\n`,
    "utf8",
  );
}

function normalizeResourceInput(input: Partial<FreeResourceInput>) {
  const title = input.title?.trim();
  const imageUrl = input.imageUrl?.trim();
  const downloadUrl = input.downloadUrl?.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!imageUrl) {
    throw new Error("Image URL is required.");
  }

  if (!downloadUrl) {
    throw new Error("Download URL is required.");
  }

  return {
    title,
    description: input.description?.trim() ?? "",
    imageUrl,
    downloadUrl,
    buttonLabel: input.buttonLabel?.trim() || "Download Free Resource",
    isPublished: Boolean(input.isPublished),
    sortOrder:
      typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
        ? input.sortOrder
        : 100,
  };
}

export async function createFreeResource(input: Partial<FreeResourceInput>) {
  const resources = await readFreeResources();
  const now = new Date().toISOString();
  const normalized = normalizeResourceInput(input);

  const resource: FreeResource = {
    id: createId(normalized.title),
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };

  await writeFreeResources([...resources, resource]);
  return resource;
}

export async function updateFreeResource(
  id: string,
  input: Partial<FreeResourceInput>,
) {
  const resources = await readFreeResources();
  const index = resources.findIndex((resource) => resource.id === id);

  if (index === -1) {
    return null;
  }

  const normalized = normalizeResourceInput(input);
  const updated: FreeResource = {
    ...resources[index],
    ...normalized,
    updatedAt: new Date().toISOString(),
  };

  resources[index] = updated;
  await writeFreeResources(resources);
  return updated;
}

export async function deleteFreeResource(id: string) {
  const resources = await readFreeResources();
  const nextResources = resources.filter((resource) => resource.id !== id);

  if (nextResources.length === resources.length) {
    return false;
  }

  await writeFreeResources(nextResources);
  return true;
}
