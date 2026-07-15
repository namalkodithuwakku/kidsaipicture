import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < 10 * 60_000);
  if (recent.length >= 5) return true;
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { word?: unknown };
    const spokenWords = typeof body.word === "string"
      ? body.word.toLowerCase().match(/[a-z]+/g)?.slice(0, 8) ?? []
      : [];
    const word = spokenWords.find((item) => SAFE_WORDS.has(item)) ?? "";

    if (!word || !SAFE_WORDS.has(word)) {
      return NextResponse.json(
        { error: "Let’s try a friendly animal, food, nature, or toy word!" },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "The picture maker needs its OpenAI key." }, { status: 503 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN && !(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)) {
      return NextResponse.json({ error: "The saved-picture library is not connected yet." }, { status: 503 });
    }

    const pathname = `kids-pictures/${word}.webp`;
    const cached = await list({ prefix: pathname, limit: 1 });
    const exact = cached.blobs.find((blob) => blob.pathname === pathname);
    if (exact) {
      return NextResponse.json({
        word: titleCase(word),
        image: exact.url,
        sentence: `Here is a friendly ${word}.`,
        cached: true,
      });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "We’ve made lots of pictures. Please explore them and try again soon!" },
        { status: 429 },
      );
    }

    const prompt = [
      `A beautiful premium children's storybook illustration of one friendly ${word}.`,
      "For preschool children ages 3 to 6. Warm, joyful, gentle and cute.",
      "Soft hand-painted gouache and watercolor texture, rounded shapes, expressive friendly face,",
      "bright harmonious colors, simple uncluttered background, centered subject, excellent detail.",
      "No text, no letters, no logo, no watermark, no frightening elements, no weapons, no injury.",
    ].join(" ");

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt,
        size: "1024x1024",
        quality: "high",
        output_format: "webp",
      }),
      signal: AbortSignal.timeout(55_000),
    });

    const imageResult = await imageResponse.json() as {
      data?: Array<{ b64_json?: string }>;
      error?: { message?: string; code?: string };
    };
    const encoded = imageResult.data?.[0]?.b64_json;
    if (!imageResponse.ok || !encoded) {
      console.error("OpenAI image error", imageResult.error?.code, imageResult.error?.message);
      const blocked = imageResult.error?.code === "moderation_blocked";
      return NextResponse.json(
        { error: blocked ? "Let’s choose a different friendly word!" : "The picture maker is resting. Please try again." },
        { status: blocked ? 400 : 502 },
      );
    }

    const bytes = Buffer.from(encoded, "base64");
    let blob;
    try {
      blob = await put(pathname, bytes, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "image/webp",
        cacheControlMaxAge: 31_536_000,
      });
    } catch (error) {
      // A simultaneous request may have saved the same word first.
      const retry = await list({ prefix: pathname, limit: 1 });
      const saved = retry.blobs.find((item) => item.pathname === pathname);
      if (!saved) throw error;
      blob = saved;
    }

    return NextResponse.json({
      word: titleCase(word),
      image: blob.url,
      sentence: `Here is a friendly ${word}.`,
      cached: false,
    });
  } catch (error) {
    console.error("Picture route failed", error);
    return NextResponse.json({ error: "The picture maker is resting. Please try again." }, { status: 500 });
  }
}
