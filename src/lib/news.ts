import { promises as fs } from "fs";
import path from "path";
import type { NewsItem, NewsItemInput } from "@/types/news";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "news.json");

function createId(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

  return `${slug || "news"}-${Date.now().toString(36)}`;
}

function sortItems(items: NewsItem[]) {
  return [...items].sort((a, b) => {
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

export async function readNewsItems() {
  await ensureDataFile();

  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as NewsItem[];
  return sortItems(parsed);
}

async function writeNewsItems(items: NewsItem[]) {
  await ensureDataFile();
  await fs.writeFile(
    dataFile,
    `${JSON.stringify(sortItems(items), null, 2)}\n`,
    "utf8",
  );
}

function normalizeInput(input: Partial<NewsItemInput>) {
  const title = input.title?.trim();
  const date = input.date?.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!date) {
    throw new Error("Date is required.");
  }

  return {
    title,
    date,
    summary: input.summary?.trim() ?? "",
    isPublished: Boolean(input.isPublished),
    sortOrder:
      typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
        ? input.sortOrder
        : 100,
  };
}

export async function createNewsItem(input: Partial<NewsItemInput>) {
  const items = await readNewsItems();
  const now = new Date().toISOString();
  const normalized = normalizeInput(input);

  const item: NewsItem = {
    id: createId(normalized.title),
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };

  await writeNewsItems([...items, item]);
  return item;
}

export async function updateNewsItem(
  id: string,
  input: Partial<NewsItemInput>,
) {
  const items = await readNewsItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const normalized = normalizeInput(input);
  const updated: NewsItem = {
    ...items[index],
    ...normalized,
    updatedAt: new Date().toISOString(),
  };

  items[index] = updated;
  await writeNewsItems(items);
  return updated;
}

export async function deleteNewsItem(id: string) {
  const items = await readNewsItems();
  const nextItems = items.filter((item) => item.id !== id);

  if (nextItems.length === items.length) {
    return false;
  }

  await writeNewsItems(nextItems);
  return true;
}
