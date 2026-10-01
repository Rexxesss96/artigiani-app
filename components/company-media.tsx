"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { uploadUrl } from "@/lib/uploads";
import { useI18n } from "@/components/i18n-provider";
import { CompanyAvatar } from "@/components/company-avatar";

// Dashboard section to manage the logo and the photos of my company.
// Uploads go to POST /api/uploads with FormData; deletions use tRPC.

type ErrorCode = "tooLarge" | "badType" | "tooMany" | "generic";

export function CompanyMedia({
  company,
}: {
  company: {
    businessName: string;
    logoFile: string | null;
    photos: { id: number; fileName: string }[];
  };
}) {
  const { dict } = useI18n();
  const m = dict.media;
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState<"logo" | "photo" | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  // Hidden <input type="file">: our nice buttons "click" it via refs.
  const logoInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const refresh = () => utils.companies.getMine.invalidate();
  const removeLogo = trpc.companies.removeLogo.useMutation({
    onSuccess: refresh,
  });
  const deletePhoto = trpc.companies.deletePhoto.useMutation({
    onSuccess: refresh,
  });

  async function upload(kind: "logo" | "photo", file: File | undefined) {
    if (!file) {
      return;
    }
    setError(null);
    setUploading(kind);

    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const code = body.error;
        setError(
          code === "tooLarge" || code === "badType" || code === "tooMany"
            ? code
            : "generic",
        );
        return;
      }
      await refresh();
    } catch {
      setError("generic");
    } finally {
      setUploading(null);
    }
  }

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">{m.title}</h2>
      <p className="mt-1 text-sm text-muted">{m.hint}</p>

      {/* ---------- Logo ---------- */}
      <h3 className="label mt-5">{m.logo}</h3>
      <div className="flex flex-wrap items-center gap-3">
        <CompanyAvatar
          name={company.businessName}
          logoFile={company.logoFile}
          size="lg"
        />
        <button
          type="button"
          onClick={() => logoInput.current?.click()}
          disabled={uploading !== null}
          className="btn btn-secondary"
        >
          {uploading === "logo"
            ? m.uploading
            : company.logoFile
              ? m.changeLogo
              : m.uploadLogo}
        </button>
        {company.logoFile && (
          <button
            type="button"
            onClick={() => removeLogo.mutate()}
            disabled={removeLogo.isPending}
            className="btn text-red-700 dark:text-red-400"
          >
            {m.removeLogo}
          </button>
        )}
        <input
          ref={logoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            upload("logo", e.target.files?.[0]);
            e.target.value = ""; // allows choosing the same file again
          }}
        />
      </div>

      {/* ---------- Photos ---------- */}
      <h3 className="label mt-6">{m.photos}</h3>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {company.photos.map((photo) => (
          <li
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={uploadUrl(photo.fileName)}
              alt=""
              fill
              sizes="(min-width: 640px) 200px, 50vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => deletePhoto.mutate({ id: photo.id })}
              disabled={deletePhoto.isPending}
              className="btn absolute right-2 bottom-2 bg-black/70 px-2 py-1 text-xs text-white hover:bg-black"
            >
              {m.deletePhoto}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            disabled={uploading !== null}
            className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm text-muted transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <span className="text-2xl" aria-hidden>
              +
            </span>
            {uploading === "photo" ? m.uploading : m.addPhoto}
          </button>
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              upload("photo", e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </li>
      </ul>

      {error && <p className="error-text mt-3">{m[error]}</p>}
    </section>
  );
}
