"use client";

import { clsx } from "clsx";
import { Layers3 } from "lucide-react";
import type { QuestionCategory } from "@/types";

type CategoryTabsProps = {
  categories: QuestionCategory[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  counts: Record<string, number>;
};

export function CategoryTabs({
  categories,
  selectedSlug,
  onSelect,
  counts,
}: CategoryTabsProps) {
  return (
    <section aria-label="หมวดคำถาม" className="space-y-3">
      <div className="flex items-center gap-2 font-hand text-xl font-semibold text-ink-900">
        <Layers3 className="h-5 w-5" aria-hidden />
        <span>หมวดคำถาม</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {categories.map((category) => {
          const isSelected = selectedSlug === category.slug;

          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onSelect(category.slug)}
              aria-pressed={isSelected}
              className={clsx(
                "btn-doodle group relative overflow-hidden rounded-note border-2 border-ink-800 px-4 py-3 text-left shadow-sketch-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon",
                isSelected
                  ? "bg-white text-ink-900"
                  : "bg-paper-50/80 text-ink-800 hover:bg-white",
              )}
              style={{
                "--btn-hover-rotate": "0.4deg",
                "--category-accent": category.accent,
              } as React.CSSProperties}
            >
              <span
                className={clsx(
                  "absolute inset-y-0 left-0 transition-all duration-300",
                  isSelected ? "opacity-100 w-3" : "opacity-60 w-2 group-hover:opacity-100 group-hover:w-2.5",
                )}
                style={{ backgroundColor: category.accent }}
                aria-hidden
              />
              <span className="flex items-start justify-between gap-4 pl-2">
                <span>
                  <span className="block font-hand text-lg font-bold leading-snug">
                    {category.name}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-ink-700">
                    {category.description}
                  </span>
                </span>
                <span className="rounded-full border border-ink-800 bg-white px-2 py-0.5 text-sm font-semibold">
                  {counts[category.slug] ?? 0}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
