import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { companies, companyPhotos, jobPhotos, jobs } from "@/server/db/schema";
import {
  deleteImage,
  detectImageType,
  MAX_IMAGE_BYTES,
  MAX_JOB_PHOTOS,
  MAX_PHOTOS,
  saveImage,
} from "@/server/storage";

// POST /api/uploads — uploads the logo or a photo of MY company
// (kind = "logo" | "photo"), or a photo of one of MY jobs
// (kind = "job-photo", with jobId).
// It's a Route Handler and not a tRPC procedure because files travel
// as multipart "FormData", which is what an HTML file input produces.
// Errors are returned as codes; the page translates them.

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return fail("unauthorized", 401);
  }

  const formData = await request.formData();
  const kind = formData.get("kind");
  const file = formData.get("file");
  if (
    (kind !== "logo" && kind !== "photo" && kind !== "job-photo") ||
    !(file instanceof File)
  ) {
    return fail("generic");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail("tooLarge");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return fail("badType");
  }

  // ---------- Photo of one of my jobs ----------
  if (kind === "job-photo") {
    const jobId = Number(formData.get("jobId"));
    const job = Number.isInteger(jobId)
      ? await db.query.jobs.findFirst({
          where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
          columns: { id: true },
        })
      : undefined;
    if (!job) {
      return fail("generic", 404);
    }
    const [{ value: photoCount }] = await db
      .select({ value: count() })
      .from(jobPhotos)
      .where(eq(jobPhotos.jobId, job.id));
    if (photoCount >= MAX_JOB_PHOTOS) {
      return fail("tooMany");
    }
    const fileName = await saveImage(bytes, type);
    await db.insert(jobPhotos).values({ jobId: job.id, fileName });
    return NextResponse.json({ fileName });
  }

  // ---------- Logo or photo of my company ----------
  const company = await db.query.companies.findFirst({
    where: eq(companies.userId, session.user.id),
    columns: { id: true, logoFile: true },
  });
  if (!company) {
    return fail("noCompany", 403);
  }

  if (kind === "photo") {
    const [{ value: photoCount }] = await db
      .select({ value: count() })
      .from(companyPhotos)
      .where(eq(companyPhotos.companyId, company.id));
    if (photoCount >= MAX_PHOTOS) {
      return fail("tooMany");
    }
  }

  const fileName = await saveImage(bytes, type);

  if (kind === "logo") {
    await db
      .update(companies)
      .set({ logoFile: fileName })
      .where(eq(companies.id, company.id));
    // The old logo isn't used anymore: remove its file.
    await deleteImage(company.logoFile);
  } else {
    await db.insert(companyPhotos).values({ companyId: company.id, fileName });
  }

  return NextResponse.json({ fileName });
}
