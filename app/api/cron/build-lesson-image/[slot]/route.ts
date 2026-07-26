import { del, list, put, type ListBlobResultBlob } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import {
  getLessonImageItems,
  LESSON_IMAGE_PAGES,
  type LessonImageItem,
  type LessonImagePage,
} from "@/lib/lesson-image-catalog";

export const runtime = "nodejs";
export const maxDuration = 300;

async function listAll(prefix: string) {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix, limit: 1000, cursor });
    blobs.push(...result.blobs);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return blobs;
}

function lessonPrompt(item: LessonImageItem) {
  const audience = item.page === "everyday"
    ? "Suitable for children, teenagers and adult English learners from many cultures."
    : "Suitable for young learners and families from many cultures.";
  return [
    item.prompt,
    "Create a premium warm storybook illustration matching the Say and See learning app.",
    "Soft hand-painted gouache and watercolor texture, rich harmonious colours, gentle natural light,",
    "rounded friendly forms, expressive but realistic people, uncluttered composition and excellent detail.",
    audience,
    "Show the situation clearly so an English learner understands it without reading.",
    "People must be fully clothed and shown in safe, respectful, everyday activities.",
    "No text, letters, captions, speech bubbles, logo, watermark, brands, frightening imagery, weapons,",
    "injury, stereotypes, political symbols, public figures or copyrighted characters.",
    "Square composition, one coherent scene, no collage.",
  ].join(" ");
}

async function createImage(item: LessonImageItem) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: lessonPrompt(item),
      size: "1024x1024",
      quality: "low",
      output_format: "webp",
      output_compression: 82,
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const result = await response.json() as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string; code?: string };
  };
  const encoded = result.data?.[0]?.b64_json;
  if (!response.ok || !encoded) {
    const error = new Error(result.error?.message || "Lesson image generation failed") as Error & { code?: string };
    error.code = result.error?.code;
    throw error;
  }
  return Buffer.from(encoded, "base64");
}

async function findNext(page: LessonImagePage) {
  const prefix = `lesson-pictures/${page}/`;
  const blobs = await listAll(prefix);
  const complete = new Set<string>();
  const skipped = new Set<string>();
  const active = new Set<string>();
  const staleLocks: string[] = [];

  for (const blob of blobs) {
    const image = blob.pathname.match(new RegExp(`^${prefix}([^/]+?)(?:-(?:low|high))?\\.webp$`, "i"));
    if (image) complete.add(image[1]);
    const skippedMatch = blob.pathname.match(new RegExp(`^${prefix}_skipped/([^/]+)\\.txt$`, "i"));
    if (skippedMatch) skipped.add(skippedMatch[1]);
    const lock = blob.pathname.match(new RegExp(`^${prefix}_locks/([^/]+)\\.txt$`, "i"));
    if (lock) {
      if (Date.now() - blob.uploadedAt.getTime() > 15 * 60_000) staleLocks.push(blob.url);
      else active.add(lock[1]);
    }
  }
  if (staleLocks.length) await Promise.all(staleLocks.map((url) => del(url).catch(() => undefined)));

  return getLessonImageItems(page).find(
    (item) => !complete.has(item.id) && !skipped.has(item.id) && !active.has(item.id),
  );
}

async function buildOne(page: LessonImagePage) {
  const item = await findNext(page);
  if (!item) return { page, complete: true };

  let lockUrl = "";
  try {
    try {
      const lock = await put(`lesson-pictures/${page}/_locks/${item.id}.txt`, new Date().toISOString(), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "text/plain",
      });
      lockUrl = lock.url;
    } catch {
      return { page, claimed: true, lesson: item.id };
    }

    const bytes = await createImage(item);
    const blob = await put(`lesson-pictures/${page}/${item.id}-low.webp`, bytes, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "image/webp",
      cacheControlMaxAge: 31_536_000,
    });
    return { page, generated: item.id, title: item.title, image: blob.url };
  } catch (error) {
    if ((error as Error & { code?: string }).code === "moderation_blocked") {
      await put(`lesson-pictures/${page}/_skipped/${item.id}.txt`, new Date().toISOString(), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/plain",
      });
    }
    throw error;
  } finally {
    if (lockUrl) await del(lockUrl).catch(() => undefined);
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ slot: string }> }) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY || (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID)) {
    return NextResponse.json({ error: "OpenAI or Blob is not configured." }, { status: 503 });
  }

  const { slot: rawSlot } = await context.params;
  const slot = Number(rawSlot);
  const dailyLimit = Math.min(30, Math.max(1, Number(process.env.DAILY_LESSON_IMAGE_LIMIT) || 30));
  const firstIndex = (slot - 1) * 2;
  if (!Number.isInteger(slot) || slot < 1 || firstIndex >= dailyLimit) {
    return NextResponse.json({ success: true, skipped: true, slot, dailyLimit });
  }

  const pages = [firstIndex, firstIndex + 1]
    .filter((index) => index < dailyLimit)
    .map((index) => LESSON_IMAGE_PAGES[index % LESSON_IMAGE_PAGES.length]);

  try {
    const results = await Promise.all(pages.map((page) => buildOne(page)));
    return NextResponse.json({ success: true, slot, dailyLimit, results });
  } catch (error) {
    console.error("Daily lesson image builder failed", slot, error);
    return NextResponse.json({ error: "Daily lesson image generation failed.", slot }, { status: 500 });
  }
}
