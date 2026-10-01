"use client";

import { Suspense, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";
import { CompanyAvatar } from "@/components/company-avatar";
import { Stars } from "@/components/stars";
import { categoryName, format } from "@/lib/i18n/dictionaries";

// /jobs/new — the customer describes a job and sends it to up to 5
// companies. Opened from a company profile, it arrives as
// /jobs/new?company=12: that company is pre-selected and its trade and
// city pre-filled.

const MAX_COMPANIES = 5;
const MAX_PHOTOS = 4;
type Urgency = "urgent" | "week" | "flexible";
type Size = "small" | "large";
type Budget = "under_200" | "200_1000" | "1000_5000" | "over_5000" | "unknown";

// A group of big clickable cards that behave like radio buttons.
function ChoiceCards<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; hint: string }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`cursor-pointer rounded-xl border p-3 transition ${
            value === option.value
              ? "border-accent bg-accent-soft text-accent-soft-foreground"
              : "border-border hover:border-muted"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span className="block text-sm font-semibold">{option.label}</span>
          <span className="block text-xs opacity-80">{option.hint}</span>
        </label>
      ))}
    </div>
  );
}

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useI18n();
  const j = dict.jobs;
  const utils = trpc.useUtils();

  // Company passed in the URL (?company=12), if any.
  const presetCompanyId = Number(searchParams.get("company")) || undefined;

  // null = "the user hasn't touched it yet": then we show the value
  // pre-filled from the company (see below).
  const [categoryInput, setCategoryInput] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cityInput, setCityInput] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("week");
  const [size, setSize] = useState<Size>("small");
  const [budget, setBudget] = useState<Budget>("unknown");
  const [photos, setPhotos] = useState<File[]>([]);
  const [selected, setSelected] = useState<number[]>(
    presetCompanyId ? [presetCompanyId] : [],
  );
  const [uploading, setUploading] = useState(false);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: presetCompany } = trpc.companies.getById.useQuery(
    { id: presetCompanyId ?? 0 },
    { enabled: !!presetCompanyId },
  );

  // Derived values: what the user chose, otherwise the company's trade
  // and city. Computing them during render (instead of copying them
  // into state with an effect) keeps a single source of truth.
  const categoryId =
    categoryInput ?? presetCompany?.categories[0]?.categoryId ?? undefined;
  const city = cityInput ?? presetCompany?.city ?? "";

  // Search only when the user stops typing the city for half a second.
  // Urgent jobs: closest companies first; otherwise best rated first.
  const searchCity = useDebouncedValue(city.trim());
  const { data: suggestions, isFetching } = trpc.companies.search.useQuery(
    {
      city: searchCity,
      categoryId,
      sort: urgency === "urgent" ? "distance" : "rating",
    },
    { enabled: !!categoryId && searchCity.length >= 2 },
  );

  const createJob = trpc.jobs.create.useMutation();

  function toggleCompany(id: number) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < MAX_COMPANIES
          ? [...prev, id]
          : prev,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      return;
    }

    // 1. Create the job (and its requests to the companies)...
    const job = await createJob.mutateAsync({
      categoryId,
      title,
      description,
      city,
      address: address || undefined,
      urgency,
      size,
      budget,
      companyIds: selected,
    });

    // 2. ...then upload the photos, now that the job has an id.
    if (photos.length > 0) {
      setUploading(true);
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("kind", "job-photo");
        formData.append("jobId", String(job.id));
        formData.append("file", photo);
        // A failed photo doesn't block the job: it's already been sent.
        await fetch("/api/uploads", { method: "POST", body: formData });
      }
      setUploading(false);
    }

    await utils.jobs.listMine.invalidate();
    router.push(`/jobs/${job.id}`);
  }

  const busy = createJob.isPending || uploading;
  // The pre-selected company stays visible even if it isn't in the
  // suggestions (e.g. it's based in another city).
  const companyOptions = [
    ...(presetCompany && !suggestions?.some((c) => c.id === presetCompany.id)
      ? [
          {
            id: presetCompany.id,
            businessName: presetCompany.businessName,
            city: presetCompany.city,
            province: presetCompany.province,
            logoFile: presetCompany.logoFile,
            averageRating: null,
            reviewCount: 0,
            emergencyService: presetCompany.emergencyService,
            distanceKm: null,
          },
        ]
      : []),
    ...(suggestions ?? []),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------- What ---------- */}
      <section className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">{j.trade}</span>
            <select
              required
              value={categoryId ?? ""}
              onChange={(e) => setCategoryInput(Number(e.target.value) || 0)}
              className="input"
            >
              <option value="">{j.chooseTrade}</option>
              {categories
                ?.toSorted((a, b) =>
                  categoryName(dict, a).localeCompare(categoryName(dict, b)),
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryName(dict, category)}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="label">{j.title}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              placeholder={j.titlePlaceholder}
              className="input"
            />
          </label>
        </div>
        <label className="block">
          <span className="label">{j.description}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder={j.descriptionPlaceholder}
            className="input"
          />
        </label>

        {/* Photos: kept in the browser until the job is sent */}
        <div>
          <span className="label">{j.photosLabel}</span>
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <span key={`${photo.name}-${index}`} className="chip gap-2 py-1">
                {photo.name}
                <button
                  type="button"
                  onClick={() =>
                    setPhotos((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="cursor-pointer underline"
                >
                  {j.removePhoto}
                </button>
              </span>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="btn btn-secondary py-1.5">
                + {j.addPhotos}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setPhotos((prev) =>
                      [...prev, ...files].slice(0, MAX_PHOTOS),
                    );
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">{dict.media.hint}</p>
        </div>
      </section>

      {/* ---------- Where, when, how big ---------- */}
      <section className="card space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">{j.city}</span>
            <input
              value={city}
              onChange={(e) => setCityInput(e.target.value)}
              required
              minLength={2}
              maxLength={60}
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">{j.address}</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={100}
              className="input"
            />
          </label>
        </div>

        <fieldset>
          <legend className="label">{j.urgencyLabel}</legend>
          <ChoiceCards
            name="urgency"
            value={urgency}
            onChange={setUrgency}
            options={(["urgent", "week", "flexible"] as const).map((v) => ({
              value: v,
              label: j[`urgency_${v}`],
              hint: j[`urgency_${v}_hint`],
            }))}
          />
        </fieldset>

        <fieldset>
          <legend className="label">{j.sizeLabel}</legend>
          <ChoiceCards
            name="size"
            value={size}
            onChange={setSize}
            options={(["small", "large"] as const).map((v) => ({
              value: v,
              label: j[`size_${v}`],
              hint: j[`size_${v}_hint`],
            }))}
          />
        </fieldset>

        <label className="block max-w-xs">
          <span className="label">{j.budgetLabel}</span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value as Budget)}
            className="input"
          >
            {(
              [
                "unknown",
                "under_200",
                "200_1000",
                "1000_5000",
                "over_5000",
              ] as const
            ).map((v) => (
              <option key={v} value={v}>
                {j[`budget_${v}`]}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* ---------- Who ---------- */}
      <section className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{j.companiesLabel}</h2>
          <span className="text-sm text-muted">
            {format(j.selectedCount, { count: selected.length })}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{j.companiesHint}</p>

        {!categoryId || city.trim().length < 2 ? (
          <p className="mt-4 text-sm text-muted">{j.chooseTradeCity}</p>
        ) : companyOptions.length === 0 && !isFetching ? (
          <p className="mt-4 text-sm text-muted">{j.noCompanies}</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {companyOptions.map((company) => {
              const checked = selected.includes(company.id);
              const full = !checked && selected.length >= MAX_COMPANIES;
              return (
                <li key={company.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      checked
                        ? "border-accent bg-accent-soft"
                        : "border-border hover:border-muted"
                    } ${full ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={full}
                      onChange={() => toggleCompany(company.id)}
                      className="accent-accent"
                    />
                    <CompanyAvatar
                      name={company.businessName}
                      logoFile={company.logoFile}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {company.businessName}
                      </span>
                      <span className="block text-xs text-muted">
                        {company.city} ({company.province})
                        {company.distanceKm !== null &&
                          ` · ${format(dict.home.distanceAway, { km: company.distanceKm })}`}
                      </span>
                      {company.emergencyService && (
                        <span className="block text-xs font-semibold text-red-700 dark:text-red-400">
                          {dict.home.emergencyBadge}
                        </span>
                      )}
                      {company.averageRating !== null && (
                        <span className="flex items-center gap-1 text-xs">
                          <Stars
                            rating={company.averageRating}
                            label={format(dict.reviewForm.outOfFive, {
                              rating: company.averageRating.toFixed(1),
                            })}
                          />
                          {company.averageRating.toFixed(1)}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {createJob.error && (
        <p className="error-text">{createJob.error.message}</p>
      )}

      <button
        type="submit"
        disabled={busy || selected.length === 0 || !categoryId}
        className="btn btn-primary w-full sm:w-auto"
      >
        {busy ? j.sending : j.send}
      </button>
    </form>
  );
}

export default function NewJobPage() {
  const { dict } = useI18n();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <p className="container-page text-muted">{dict.common.loading}</p>;
  }
  if (!session) {
    return (
      <main className="container-page">
        <p className="card">
          {dict.requestsPage.loginRequired}{" "}
          <Link href="/login" className="link">
            {dict.nav.login}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container-page max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {dict.jobs.newTitle}
      </h1>
      <p className="mt-1 mb-6 text-muted">{dict.jobs.newSubtitle}</p>
      {/* useSearchParams needs a Suspense boundary around it */}
      <Suspense>
        <NewJobForm />
      </Suspense>
    </main>
  );
}
