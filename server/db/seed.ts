import "dotenv/config";
import { db } from "./index";
import { categories } from "./schema";

const BASE_CATEGORIES = [
  { name: "Mason", slug: "mason" },
  { name: "Plumber", slug: "plumber" },
  { name: "Electrician", slug: "electrician" },
  { name: "Painter", slug: "painter" },
  { name: "Tiler", slug: "tiler" },
  { name: "Carpenter", slug: "carpenter" },
  { name: "Locksmith", slug: "locksmith" },
  { name: "Gardener", slug: "gardener" },
  { name: "Window Installer", slug: "window-installer" },
  { name: "House Painter", slug: "house-painter" },
];

async function main() {
  console.log("Seeding base categories...");
  await db.insert(categories).values(BASE_CATEGORIES).onConflictDoNothing();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
