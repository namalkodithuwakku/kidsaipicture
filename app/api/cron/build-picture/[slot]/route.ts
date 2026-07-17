import { readdir } from "node:fs/promises";
import path from "node:path";
import { del, list, put, type ListBlobResultBlob } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import pictureCatalog from "@/public/data/picture-catalog.json";

export const runtime = "nodejs";
export const maxDuration = 300;

type CatalogItem = { id: string; word: string };

async function listAllBlobs() {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "kids-pictures/", limit: 1000, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

function imagePrompt(word: string) {
  return [
    `A beautiful premium children's storybook illustration clearly showing ${word}.`,
    "For preschool children ages 3 to 6. Warm, joyful, gentle and cute.",
    "Show the subject clearly and accurately so a young child can recognise and learn it.",
    "Soft hand-painted gouache and watercolor texture, rounded shapes, bright harmonious colors,",
    "simple uncluttered setting, centered subject, excellent detail and a playful learning mood.",
    "People must be fully clothed, kind and shown doing safe everyday activities.",
    "No text, letters, logo, watermark, brands, frightening elements, danger, weapons, injury,",
    "adult themes, stereotypes, political symbols, real public figures or copyrighted characters.",
  ].join(" ");
}

async function createLowCostImage(word: string) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: imagePrompt(word),
      size: "1024x1024",
      quality: "low",
      output_format: "webp",
      output_compression: 82,
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const result = await response.json() as { data?: Array<{ b64_json?: string }>; error?: { message?: string; code?: string } };
  const encoded = result.data?.[0]?.b64_json;
  if (!response.ok || !encoded) {
    const error = new Error(result.error?.message || "Image generation failed") as Error & { code?: string };
    error.code = result.error?.code;
    throw error;
  }
  return Buffer.from(encoded, "base64");
}

export async function GET(request: NextRequest, context: { params: Promise<{ slot: string }> }) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY || (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID)) {
    return NextResponse.json({ error: "OpenAI or Blob is not configured." }, { status: 503 });
  }

  const { slot } = await context.params;
  try {
    const catalog = (pictureCatalog.items as CatalogItem[]);
    const localFiles = await readdir(path.join(process.cwd(), "public", "pictures"), { recursive: true });
    const localIds = new Set(localFiles.filter((file) => file.toLowerCase().endsWith(".webp"))
      .map((file) => path.basename(file, path.extname(file)).toLowerCase()));
    const blobs = await listAllBlobs();
    const completedIds = new Set(localIds);
    const skippedIds = new Set<string>();
    const activeLockIds = new Set<string>();
    const staleLockUrls: string[] = [];
    for (const blob of blobs) {
      const completed = blob.pathname.match(/^kids-pictures\/(.+?)(?:-(?:low|high))?\.webp$/i);
      if (completed && !blob.pathname.endsWith("-preview.webp")) completedIds.add(completed[1].toLowerCase());
      const skipped = blob.pathname.match(/^kids-pictures\/_daily-skipped\/(.+)\.txt$/i);
      if (skipped) skippedIds.add(skipped[1].toLowerCase());
      const lock = blob.pathname.match(/^kids-pictures\/_daily-locks\/(.+)\.txt$/i);
      if (lock) {
        if (Date.now() - blob.uploadedAt.getTime() > 15 * 60_000) staleLockUrls.push(blob.url);
        else activeLockIds.add(lock[1].toLowerCase());
      }
    }
    if (staleLockUrls.length) await Promise.all(staleLockUrls.map((url) => del(url).catch(() => undefined)));

    const next = catalog.find((item) =>
      !completedIds.has(item.id) && !skippedIds.has(item.id) && !activeLockIds.has(item.id)
    );
    if (!next) {
      return NextResponse.json({ success: true, complete: true, completed: completedIds.size, total: catalog.length });
    }

    let lockUrl = "";
    try {
      try {
        const lock = await put(`kids-pictures/_daily-locks/${next.id}.txt`, new Date().toISOString(), {
          access: "public", addRandomSuffix: false, allowOverwrite: false, contentType: "text/plain",
        });
        lockUrl = lock.url;
      } catch {
        return NextResponse.json({ success: true, slot, claimed: true, word: next.word });
      }
      const bytes = await createLowCostImage(next.word);
      const blob = await put(`kids-pictures/${next.id}-low.webp`, bytes, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "image/webp",
        cacheControlMaxAge: 31_536_000,
      });
      return NextResponse.json({
        success: true,
        slot,
        generated: next.word,
        quality: "low",
        image: blob.url,
        completed: completedIds.size + 1,
        remaining: Math.max(0, catalog.length - completedIds.size - skippedIds.size - 1),
        total: catalog.length,
      });
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "moderation_blocked") {
        await put(`kids-pictures/_daily-skipped/${next.id}.txt`, new Date().toISOString(), {
          access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "text/plain",
        });
      }
      throw error;
    } finally {
      if (lockUrl) await del(lockUrl).catch(() => undefined);
    }
  } catch (error) {
    console.error("Daily picture builder failed", slot, error);
    return NextResponse.json({ error: "Daily picture generation failed.", slot }, { status: 500 });
  }
}
