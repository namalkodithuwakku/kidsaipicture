import { list, type ListBlobResultBlob } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isLessonImagePage } from "@/lib/lesson-image-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page");
  if (!isLessonImagePage(page)) {
    return NextResponse.json({ error: "Invalid lesson page." }, { status: 400 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json({ page, images: {} });
  }

  try {
    const blobs = await listAll(`lesson-pictures/${page}/`);
    const images: Record<string, string> = {};
    for (const blob of blobs) {
      const match = blob.pathname.match(
        new RegExp(`^lesson-pictures/${page}/([^/]+?)(?:-(?:low|high))?\\.webp$`, "i"),
      );
      if (!match || blob.pathname.includes("/_")) continue;
      images[match[1]] = blob.url;
    }
    return NextResponse.json(
      { page, images },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Lesson image list failed", page, error);
    return NextResponse.json({ error: "Could not load lesson images." }, { status: 500 });
  }
}
