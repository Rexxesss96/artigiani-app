"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";
import { categoryName } from "@/lib/i18n/dictionaries";

// The company form, used both to register a company ("create") and to
// edit it later ("edit"). The page decides what happens on submit: this
// component only collects the values and passes them to `onSubmit`.

export type CompanyFormValues = {
  businessName: string;
  vatNumber: string;
  sdiCode?: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone?: string;
  description?: string;
  categoryIds: number[];
};

type Props = {
  mode: "create" | "edit";
  initial?: Partial<CompanyFormValues>;
  onSubmit: (values: CompanyFormValues) => void;
  isPending: boolean;
  error?: string;
  onCancel?: () => void;
};

export function CompanyForm({
  mode,
  initial,
  onSubmit,
  isPending,
  error,
  onCancel,
}: Props) {
  const { dict } = useI18n();
  const d = dict.dashboard;
  const { data: categories, isPending: categoriesPending } =
    trpc.categories.list.useQuery();

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initial?.categoryIds ?? [],
  );

  function toggleCategory(id: number) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Small helper: read a field as text ("" if missing).
    const get = (name: string) => String(formData.get(name) ?? "").trim();

    onSubmit({
      businessName: get("businessName"),
      vatNumber: get("vatNumber"),
      sdiCode: get("sdiCode") || undefined,
      address: get("address"),
      city: get("city"),
      province: get("province").toUpperCase(),
      postalCode: get("postalCode"),
      phone: get("phone") || undefined,
      description: get("description") || undefined,
      categoryIds: selectedCategories,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="label">{d.businessName}</span>
        <input
          name="businessName"
          defaultValue={initial?.businessName}
          required
          maxLength={100}
          className="input"
        />
      </label>

      {mode === "create" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">{d.vatNumber}</span>
            <input
              name="vatNumber"
              required
              inputMode="numeric"
              pattern="[0-9]{11}"
              minLength={11}
              maxLength={11}
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">{d.sdiCode}</span>
            <input name="sdiCode" maxLength={7} className="input" />
          </label>
        </div>
      )}

      <label className="block">
        <span className="label">{d.address}</span>
        <input
          name="address"
          defaultValue={initial?.address}
          required
          maxLength={100}
          className="input"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="block">
          <span className="label">{d.city}</span>
          <input
            name="city"
            defaultValue={initial?.city}
            required
            maxLength={60}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">{d.province}</span>
          <input
            name="province"
            defaultValue={initial?.province}
            required
            minLength={2}
            maxLength={2}
            className="input uppercase"
          />
        </label>
        <label className="block">
          <span className="label">{d.postalCode}</span>
          <input
            name="postalCode"
            defaultValue={initial?.postalCode}
            required
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            className="input"
          />
        </label>
      </div>

      <label className="block">
        <span className="label">{d.phone}</span>
        <input
          name="phone"
          type="tel"
          defaultValue={initial?.phone}
          maxLength={20}
          className="input"
        />
      </label>

      <label className="block">
        <span className="label">{d.description}</span>
        <textarea
          name="description"
          defaultValue={initial?.description}
          rows={4}
          maxLength={2000}
          className="input"
        />
      </label>

      <fieldset>
        <legend className="label">{d.trades}</legend>
        {categoriesPending && (
          <p className="text-sm text-muted">{d.loadingCategories}</p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories?.map((category) => {
            const checked = selectedCategories.includes(category.id);
            return (
              <label
                key={category.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-accent bg-accent-soft text-accent-soft-foreground"
                    : "border-border hover:border-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category.id)}
                  className="accent-accent"
                />
                {categoryName(dict, category)}
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && <p className="error-text">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || selectedCategories.length === 0}
          className="btn btn-primary"
        >
          {mode === "create"
            ? isPending
              ? d.creating
              : d.register
            : isPending
              ? d.saving
              : d.save}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {d.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
