import { del, list, put, type ListBlobResultBlob } from "@vercel/blob";
import { after, NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const SAFE_WORDS = new Set(`
  alligator ant apple astronaut avocado baby badger balloon banana bear bee beetle bicycle bird
  boat book bunny butterfly cake camel car carrot cat caterpillar cherry chicken cloud cow crab
  crocodile cupcake deer dinosaur dog dolphin donkey duck eagle elephant fairy fish flamingo flower
  fox frog giraffe goat grape grasshopper hamster hedgehog hippo horse icecream iguana island jellyfish
  kangaroo kitten koala ladybug lamb lemon lion llama mango monkey moon mouse octopus orange owl panda
  parrot peach peacock pear penguin pig pineapple planet pony puppy rabbit rainbow robot rocket seal
  sheep snail snowman squirrel star strawberry sun tiger tortoise train tree turtle unicorn watermelon
  whale zebra
`.trim().split(/\s+/));

const attempts = new Map<string, number[]>();

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function sentenceFor(word: string) {
  return `Here is a friendly ${word}.`;
}

function parseSafeWord(raw: unknown) {
  const spokenWords = typeof raw === "string"
    ? raw.toLowerCase().match(/[a-z]+/g)?.slice(0, 8) ?? []
    : [];
  return spokenWords.find((item) => SAFE_WORDS.has(item)) ?? "";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < 10 * 60_000);
  if (recent.length >= 5) return true;
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

function pathsFor(word: string) {
  return {
    legacy: `kids-pictures/${word}.webp`,
    preview: `kids-pictures/${word}-preview.webp`,
    high: `kids-pictures/${word}-high.webp`,
    marker: `kids-pictures/${word}-upgrading.txt`,
  };
}

async function findPictures(word: string) {
  const paths = pathsFor(word);
  const result = await list({ prefix: `kids-pictures/${word}`, limit: 10 });
  return {
    paths,
    legacy: result.blobs.find((blob) => blob.pathname === paths.legacy),
    preview: result.blobs.find((blob) => blob.pathname === paths.preview),
    high: result.blobs.find((blob) => blob.pathname === paths.high),
    marker: result.blobs.find((blob) => blob.pathname === paths.marker),
  };
}

function pictureResponse(word: string, blob: { url: string }, quality: "preview" | "high", cached: boolean) {
  return NextResponse.json({
    word: titleCase(word),
    image: blob.url,
    sentence: sentenceFor(word),
    quality,
    upgrading: quality === "preview",
    cached,
  });
}

function promptFor(word: string) {
  return [
    `A beautiful premium children's storybook illustration of one friendly ${word}.`,
    "For preschool children ages 3 to 6. Warm, joyful, gentle and cute.",
    "Soft hand-painted gouache and watercolor texture, rounded shapes, expressive friendly face,",
    "bright harmonious colors, simple uncluttered background, centered subject, excellent detail.",
    "No text, no letters, no logo, no watermark, no frightening elements, no weapons, no injury.",
  ].join(" ");
}

async function createImage(word: string, quality: "low" | "high", timeoutMs: number) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: promptFor(word),
      size: "1024x1024",
      quality,
      output_format: "webp",
      output_compression: quality === "low" ? 75 : 90,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const result = await response.json() as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string; code?: string };
  };
  const encoded = result.data?.[0]?.b64_json;
  if (!response.ok || !encoded) {
    console.error(`OpenAI ${quality} image error`, result.error?.code, result.error?.message);
    const error = new Error(result.error?.message || "Image generation failed") as Error & { code?: string };
    error.code = result.error?.code;
    throw error;
  }
  return Buffer.from(encoded, "base64");
}

async function savePicture(pathname: string, bytes: Buffer) {
  try {
    return await put(pathname, bytes, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "image/webp",
      cacheControlMaxAge: 31_536_000,
    });
  } catch (error) {
    const retry = await list({ prefix: pathname, limit: 1 });
    const saved = retry.blobs.find((item) => item.pathname === pathname);
    if (!saved) throw error;
    return saved;
  }
}

async function claimUpgrade(word: string, existingMarker?: ListBlobResultBlob) {
  const { marker } = pathsFor(word);
  if (existingMarker) {
    const stale = Date.now() - existingMarker.uploadedAt.getTime() > 10 * 60_000;
    if (!stale) return false;
    await del(existingMarker.url).catch(() => undefined);
  }

  try {
    await put(marker, new Date().toISOString(), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "text/plain",
      cacheControlMaxAge: 60,
    });
    return true;
  } catch {
    return false;
  }
}

async function upgradeInBackground(word: string) {
  const { high, marker } = pathsFor(word);
  try {
    const current = await findPictures(word);
    if (current.high || current.legacy) return;
    const bytes = await createImage(word, "high", 220_000);
    await savePicture(high, bytes);
  } catch (error) {
    console.error("High-quality background upgrade failed", word, error);
  } finally {
    await del(marker).catch(() => undefined);
  }
}

async function scheduleUpgrade(word: string, marker?: ListBlobResultBlob) {
  if (await claimUpgrade(word, marker)) {
    after(() => upgradeInBackground(word));
  }
}

export async function GET(request: NextRequest) {
  try {
    const word = parseSafeWord(request.nextUrl.searchParams.get("word"));
    if (!word) return NextResponse.json({ error: "Friendly word required." }, { status: 400 });

    const pictures = await findPictures(word);
    const finalPicture = pictures.high ?? pictures.legacy;
    if (finalPicture) return pictureResponse(word, finalPicture, "high", true);
    if (pictures.preview) return pictureResponse(word, pictures.preview, "preview", true);
    return NextResponse.json({ status: "missing" }, { status: 404 });
  } catch (error) {
    console.error("Picture status route failed", error);
    return NextResponse.json({ error: "Could not check the picture yet." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { word?: unknown };
    const word = parseSafeWord(body.word);
    if (!word) {
      return NextResponse.json(
        { error: "Let’s try a friendly animal, food, nature, or toy word!" },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "The picture maker needs its OpenAI key." }, { status: 503 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
      return NextResponse.json({ error: "The saved-picture library is not connected yet." }, { status: 503 });
    }

    const pictures = await findPictures(word);
    const finalPicture = pictures.high ?? pictures.legacy;
    if (finalPicture) return pictureResponse(word, finalPicture, "high", true);

    if (pictures.preview) {
      await scheduleUpgrade(word, pictures.marker);
      return pictureResponse(word, pictures.preview, "preview", true);
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "We’ve made lots of pictures. Please explore them and try again soon!" },
        { status: 429 },
      );
    }

    const previewBytes = await createImage(word, "low", 70_000);
    const preview = await savePicture(pictures.paths.preview, previewBytes);
    await scheduleUpgrade(word, pictures.marker);
    return pictureResponse(word, preview, "preview", false);
  } catch (error) {
    console.error("Picture route failed", error);
    const code = (error as Error & { code?: string })?.code;
    const blocked = code === "moderation_blocked";
    return NextResponse.json(
      { error: blocked ? "Let’s choose a different friendly word!" : "The picture maker is resting. Please try again." },
      { status: blocked ? 400 : 500 },
    );
  }
}
