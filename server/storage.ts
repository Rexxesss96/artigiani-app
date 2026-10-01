import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Where uploaded images live: the uploads/ folder of the project (it's in
// .gitignore). All file access goes through this module, so moving to a
// cloud storage later (for the deploy) means changing only this file.

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB
export const MAX_PHOTOS = 8;

type ImageType = { ext: "jpg" | "png" | "webp"; contentType: string };

// Recognizes the image type from its first bytes ("magic numbers"),
// instead of trusting the file name or the type sent by the browser.
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const startsWith = (sig: number[], offset = 0) =>
    sig.every((byte, i) => bytes[offset + i] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (startsWith([0x89, 0x50, 0x4e, 0x47])) {
    return { ext: "png", contentType: "image/png" };
  }
  // "RIFF" .... "WEBP"
  if (
    startsWith([0x52, 0x49, 0x46, 0x46]) &&
    startsWith([0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}

// Only names we generated ourselves are valid: this blocks tricks like
// "../../.env" (path traversal) when reading or deleting files.
const VALID_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export async function saveImage(bytes: Uint8Array, type: ImageType) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${randomUUID()}.${type.ext}`;
  await writeFile(path.join(UPLOAD_DIR, fileName), bytes);
  return fileName;
}

export async function readImage(fileName: string) {
  if (!VALID_NAME.test(fileName)) {
    return null;
  }
  try {
    const data = await readFile(path.join(UPLOAD_DIR, fileName));
    const ext = fileName.split(".").pop() as keyof typeof CONTENT_TYPES;
    return { data, contentType: CONTENT_TYPES[ext] };
  } catch {
    return null;
  }
}

export async function deleteImage(fileName: string | null | undefined) {
  if (!fileName || !VALID_NAME.test(fileName)) {
    return;
  }
  // If the file is already gone, there's nothing to do.
  await unlink(path.join(UPLOAD_DIR, fileName)).catch(() => {});
}
