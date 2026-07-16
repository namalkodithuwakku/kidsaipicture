import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CatalogItem = {
  id: string;
  word: string;
  category: string;
  categoryTitle: string;
  image: string;
  speech: string;
};

type PictureCatalog = { version: number; items: CatalogItem[] };

export async function GET() {
  try {
    const publicDirectory = path.join(process.cwd(), "public");
    const catalogPath = path.join(publicDirectory, "data", "picture-catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as PictureCatalog;
    const pictureDirectory = path.join(publicDirectory, "pictures");
    const pictureFiles = await readdir(pictureDirectory, { recursive: true });
    const availablePaths = new Set(
      pictureFiles
        .filter((file) => file.toLowerCase().endsWith(".webp"))
        .map((file) => `/pictures/${file.replaceAll("\\", "/")}`),
    );

    const available = catalog.items.map((item) => {
      const flatImage = `/pictures/${item.id}.webp`;
      const starterImage = `/pictures/first-words/${item.id}.webp`;
      const image = [item.image, flatImage, starterImage].find((candidate) => availablePaths.has(candidate)) ?? null;

      if (!image) return null;
      return {
        id: item.id,
        word: item.word.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        image,
        category: item.category,
        categoryTitle: item.categoryTitle,
        speech: item.speech,
        sentence: `Let’s look at this ${item.word}.`,
      };
    });

    return NextResponse.json({ version: catalog.version, pictures: available.filter(Boolean) });
  } catch (error) {
    console.error("Gallery catalog failed", error);
    return NextResponse.json({ error: "The picture gallery could not be loaded." }, { status: 500 });
  }
}
