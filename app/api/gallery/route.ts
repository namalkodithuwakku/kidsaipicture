import { readdir } from "node:fs/promises";
import path from "node:path";
import { list, type ListBlobResultBlob } from "@vercel/blob";
import { NextResponse } from "next/server";
import pictureCatalog from "@/public/data/picture-catalog.json";

export const runtime = "nodejs";

type CatalogItem = {
  id: string;
  word: string;
  category: string;
  categoryTitle: string;
  image: string;
  speech: string;
};

type GalleryPicture = {
  id: string;
  word: string;
  image: string;
  category: string;
  categoryTitle: string;
  speech: string;
  sentence: string;
  upgrading?: boolean;
};

function titleCase(word: string) {
  return word.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function listSharedPictures() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return [];
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "kids-pictures/", limit: 1000, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function GET() {
  try {
    const catalog = pictureCatalog as { version: number; items: CatalogItem[] };
    const pictureDirectory = path.join(process.cwd(), "public", "pictures");
    const pictureFiles = await readdir(pictureDirectory, { recursive: true });
    const availablePaths = new Set(
      pictureFiles.filter((file) => file.toLowerCase().endsWith(".webp"))
        .map((file) => `/pictures/${file.replaceAll("\\", "/")}`),
    );

    const localPictures = new Map<string, GalleryPicture>();
    for (const item of catalog.items) {
      const image = [item.image, `/pictures/${item.id}.webp`, `/pictures/first-words/${item.id}.webp`]
        .find((candidate) => availablePaths.has(candidate));
      if (!image) continue;
      localPictures.set(item.id, {
        id: item.id,
        word: titleCase(item.word),
        image,
        category: item.category,
        categoryTitle: item.categoryTitle,
        speech: item.speech,
        sentence: `Let’s look at this ${item.word}.`,
      });
    }

    const catalogByKey = new Map<string, CatalogItem>();
    for (const item of catalog.items) {
      for (const key of [item.id, item.word.toLowerCase(), item.word.toLowerCase().replaceAll(" ", "-")]) {
        catalogByKey.set(key, item);
      }
    }

    const bestBlobByWord = new Map<string, { blob: ListBlobResultBlob; rank: number }>();
    try {
      for (const blob of await listSharedPictures()) {
        const match = blob.pathname.match(/^kids-pictures\/(.+?)(?:-(preview|low|high))?\.webp$/i);
        if (!match) continue;
        const key = match[1].toLowerCase();
        const quality = match[2]?.toLowerCase();
        const rank = quality === "high" ? 3 : quality === "preview" ? 1 : 2;
        const current = bestBlobByWord.get(key);
        if (!current || rank > current.rank) bestBlobByWord.set(key, { blob, rank });
      }
    } catch (error) {
      console.error("Shared Blob gallery could not be listed", error);
    }

    const sharedPictures: Array<GalleryPicture & { uploadedAt: Date }> = [];
    for (const [key, { blob, rank }] of bestBlobByWord) {
      const item = catalogByKey.get(key);
      if (!item || localPictures.has(item.id)) continue;
      sharedPictures.push({
        id: item.id,
        word: titleCase(item.word),
        image: blob.url,
        category: item.category,
        categoryTitle: item.categoryTitle,
        speech: item.speech,
        sentence: `Let’s look at this ${item.word}.`,
        uploadedAt: blob.uploadedAt,
        ...(rank === 1 ? { upgrading: false } : {}),
      });
    }
    sharedPictures.sort((left, right) => right.uploadedAt.getTime() - left.uploadedAt.getTime());
    const pictures = [
      ...sharedPictures,
      ...localPictures.values(),
    ];

    return NextResponse.json(
      { version: catalog.version, pictures },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Gallery catalog failed", error);
    return NextResponse.json({ error: "The picture gallery could not be loaded." }, { status: 500 });
  }
}
