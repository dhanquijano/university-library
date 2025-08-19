import dummyBooks from "../dummybooks.json";
import fs from "fs";
import path from "path";
import ImageKit from "imagekit";
import { books, servicesCatalog } from "@/database/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

const uploadToImageKit = async (
  url: string,
  fileName: string,
  folder: string,
) => {
  try {
    const response = await imagekit.upload({
      file: url,
      fileName,
      folder,
    });

    return response.filePath;
  } catch (error) {
    console.error("Error uploading image to ImageKit:", error);
  }
};

const seed = async () => {
  console.log("Seeding data... ");

  try {
    // Seed services_catalog from public/services.json if table is empty
    try {
      const existing = await db.select().from(servicesCatalog);
      if (!existing || existing.length === 0) {
        const servicesFilePath = path.join(process.cwd(), "public", "services.json");
        const json = JSON.parse(fs.readFileSync(servicesFilePath, "utf8"));
        for (const s of json) {
          await db.insert(servicesCatalog).values({
            category: s.category,
            title: s.title,
            description: s.description || "",
            price: String(parseFloat(s.price) || 0),
          });
        }
        console.log("Seeded services catalog from services.json");
      }
    } catch (e) {
      console.log("Skipping services seed:", e);
    }

    for (const book of dummyBooks) {
      const coverUrl = (await uploadToImageKit(
        book.coverUrl,
        `${book.title}.jpg`,
        "/books/covers",
      )) as string;

      const videoUrl = (await uploadToImageKit(
        book.videoUrl,
        `${book.title}.mp4`,
        "/books/videos",
      )) as string;

      await db.insert(books).values({
        ...book,
        coverUrl,
        videoUrl,
      });
    }
    console.log("Data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data: ", error);
  }
};

seed();
