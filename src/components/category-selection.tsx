"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { clsx } from "clsx";
import {
  Sparkles,
  MessageCircle,
  Heart,
  History,
  Users,
  Layers,
} from "lucide-react";
import type { QuestionCategory, QuestionDeck } from "@/types";

type CategorySelectionProps = {
  deck: QuestionDeck;
};

const allCategory: QuestionCategory = {
  id: "all",
  slug: "all",
  name: "ทั้งหมด",
  description: "รวมคำถามจากทุกหมวดหมู่ไว้ในกองเดียวสำหรับทุกความสัมพันธ์",
  accent: "#ffd5bd",
  sortOrder: 0,
};

function getCategoryIcon(slug: string) {
  switch (slug) {
    case "icebreaker":
      return <MessageCircle className="h-6 w-6" />;
    case "love":
      return <Heart className="h-6 w-6" />;
    case "memory":
      return <History className="h-6 w-6" />;
    case "family":
      return <Users className="h-6 w-6" />;
    default:
      return <Layers className="h-6 w-6" />;
  }
}

// Custom rotation classes to give a realistic hand-drawn/scattered layout
const tilts = [
  "rotate-[-1.5deg] hover:rotate-[0.5deg]",
  "rotate-[1deg] hover:rotate-[-0.5deg]",
  "rotate-[-1deg] hover:rotate-[1deg]",
  "rotate-[2deg] hover:rotate-[-1deg]",
  "rotate-[-2deg] hover:rotate-[1.5deg]",
];

export function CategorySelection({ deck }: CategorySelectionProps) {
  const categories = useMemo(
    () => [allCategory, ...deck.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [deck.categories],
  );

  const counts = useMemo(() => {
    return deck.questions.reduce<Record<string, number>>(
      (accumulator, question) => {
        accumulator[allCategory.slug] += 1;
        accumulator[question.categorySlug] = (accumulator[question.categorySlug] ?? 0) + 1;
        return accumulator;
      },
      { [allCategory.slug]: 0 },
    );
  }, [deck.questions]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-ink-900 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <Image
        src="/sketch-notes.svg"
        alt=""
        width={360}
        height={260}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 hidden w-56 rotate-2 opacity-80 sm:block lg:right-12 lg:top-8"
      />
      <div className="pointer-events-none absolute -left-24 top-44 h-48 w-48 rotate-12 rounded-[42%_58%_47%_53%] border-2 border-dashed border-ink-800/20 bg-doodle-sky/30" />
      <div className="pointer-events-none absolute bottom-10 right-4 h-32 w-32 rotate-[-10deg] rounded-[55%_45%_50%_50%] border-2 border-dashed border-ink-800/20 bg-doodle-mint/40" />

      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <div className="inline-flex rotate-[-1.5deg] items-center gap-2 rounded-full border-2 border-ink-800 bg-doodle-lemon px-4 py-1.5 font-hand text-base font-bold shadow-sketch-soft">
            <Sparkles className="h-5 w-5 animate-pulse text-ink-900" aria-hidden />
            <span>พื้นที่คุยแบบใจเย็น</span>
          </div>
          <h1 className="mt-6 font-hand text-6xl font-bold leading-tight tracking-normal text-ink-900 sm:text-7xl">
            KhuiDeep
            <span className="block text-4xl mt-1 text-ink-800 font-medium">คุยดีพ</span>
          </h1>
          <p className="mt-6 font-hand text-xl leading-relaxed text-ink-700">
            การ์ดคำถามภาษาไทยสำหรับเปิดบทสนทนาที่จริงใจ อบอุ่น และฟังกันลึกขึ้น
            <span className="block mt-1 text-sm font-body text-ink-500">
              เลือกหมวดหมู่คำถามด้านล่างเพื่อเริ่มการเดินทางในบทสนทนา
            </span>
          </p>
        </header>

        {/* Categories Grid */}
        <section aria-label="เลือกหมวดหมู่คำถาม" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const tiltClass = tilts[index % tilts.length];
            const icon = getCategoryIcon(category.slug);
            const count = counts[category.slug] ?? 0;

            return (
              <Link
                key={category.slug}
                href={`/play/${category.slug}`}
                className={clsx(
                  "group relative flex flex-col justify-between min-h-[260px] p-6",
                  "sketchy-panel transition-all duration-300 ease-out",
                  "hover:-translate-y-2 hover:scale-[1.02] hover:shadow-sketch-md",
                  tiltClass,
                )}
                style={{
                  backgroundColor: "rgba(255, 253, 247, 0.95)",
                }}
              >
                {/* Accent Color Band */}
                <div
                  className="absolute top-0 inset-x-0 h-3 rounded-t-[22px_16px_0_0]"
                  style={{ backgroundColor: category.accent }}
                  aria-hidden
                />

                {/* Card Top */}
                <div className="relative pt-3">
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon Box */}
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-800 shadow-sketch-soft transition-transform duration-300 group-hover:rotate-[-6deg]"
                      style={{ backgroundColor: category.accent }}
                    >
                      {icon}
                    </div>

                    {/* Count Badge */}
                    <span className="inline-block rounded-full border-2 border-ink-800 bg-white px-2.5 py-0.5 font-hand text-sm font-bold shadow-sketch-soft">
                      {count} ใบ
                    </span>
                  </div>

                  <h2 className="mt-5 font-hand text-2xl font-bold leading-tight text-ink-900 group-hover:text-ink-800">
                    {category.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">
                    {category.description}
                  </p>
                </div>

                {/* Card Bottom / CTA */}
                <div className="mt-6 border-t border-dashed border-ink-800/20 pt-4 flex items-center justify-between text-ink-800">
                  <span className="font-hand text-lg font-bold group-hover:rough-underline transition-all duration-200">
                    หยิบการ์ดหมวดนี้ →
                  </span>
                  <span
                    className="h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-150"
                    style={{ backgroundColor: category.accent }}
                  />
                </div>
              </Link>
            );
          })}
        </section>

        {/* Footer info note */}
        <footer className="mt-16 text-center text-xs text-ink-500 font-body">
          <p>© {new Date().getFullYear()} KhuiDeep — สนทนาอย่างเปิดใจและถนอมความรู้สึก</p>
        </footer>
      </div>
    </main>
  );
}
