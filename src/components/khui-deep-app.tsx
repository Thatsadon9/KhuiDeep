"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  BookOpenText,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { CategoryTabs } from "@/components/category-tabs";
import { FlippingCard } from "@/components/flipping-card";
import type { DeepQuestion, QuestionCategory, QuestionDeck } from "@/types";

type KhuiDeepAppProps = {
  deck: QuestionDeck;
};

const allCategory: QuestionCategory = {
  id: "all",
  slug: "all",
  name: "ทั้งหมด",
  description: "รวมคำถามจากทุกหมวดไว้ในกองเดียว",
  accent: "#ffd5bd",
  sortOrder: 0,
};

function pickRandomQuestion(pool: DeepQuestion[], currentId?: string) {
  if (pool.length === 0) {
    return null;
  }

  const candidates =
    pool.length > 1 && currentId
      ? pool.filter((question) => question.id !== currentId)
      : pool;

  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

export function KhuiDeepApp({ deck }: KhuiDeepAppProps) {
  const categories = useMemo(
    () => [allCategory, ...deck.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [deck.categories],
  );
  const [selectedSlug, setSelectedSlug] = useState(allCategory.slug);
  const [currentQuestion, setCurrentQuestion] = useState<DeepQuestion | null>(
    deck.questions[0] ?? null,
  );
  const [usedIds, setUsedIds] = useState<Set<string>>(
    () => new Set(deck.questions[0] ? [deck.questions[0].id] : []),
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [roundNotice, setRoundNotice] = useState("");

  const questionPool = useMemo(() => {
    if (selectedSlug === allCategory.slug) {
      return deck.questions;
    }

    return deck.questions.filter((question) => question.categorySlug === selectedSlug);
  }, [deck.questions, selectedSlug]);

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

  const currentCategory = useMemo(() => {
    if (currentQuestion) {
      return deck.categories.find(
        (category) => category.slug === currentQuestion.categorySlug,
      );
    }

    return categories.find((category) => category.slug === selectedSlug);
  }, [categories, currentQuestion, deck.categories, selectedSlug]);

  const remainingCount = Math.max(questionPool.length - usedIds.size, 0);

  useEffect(() => {
    const firstQuestion = questionPool[0] ?? null;

    setCurrentQuestion(firstQuestion);
    setUsedIds(new Set(firstQuestion ? [firstQuestion.id] : []));
    setIsFlipped(false);
    setRoundNotice("");
  }, [questionPool]);

  const drawQuestion = useCallback(() => {
    if (questionPool.length === 0) {
      return;
    }

    let availableQuestions = questionPool.filter((question) => !usedIds.has(question.id));
    let nextUsedIds = new Set(usedIds);
    let notice = "";

    if (availableQuestions.length === 0) {
      availableQuestions = questionPool;
      nextUsedIds = new Set();
      notice = "ครบทุกใบแล้ว เริ่มรอบใหม่ให้แล้วนะ";
    }

    const nextQuestion = pickRandomQuestion(availableQuestions, currentQuestion?.id);

    if (!nextQuestion) {
      return;
    }

    nextUsedIds.add(nextQuestion.id);
    setCurrentQuestion(nextQuestion);
    setUsedIds(nextUsedIds);
    setIsFlipped(false);
    setRoundNotice(notice);
  }, [currentQuestion?.id, questionPool, usedIds]);

  const resetRound = useCallback(() => {
    setUsedIds(new Set(currentQuestion ? [currentQuestion.id] : []));
    setIsFlipped(false);
    setRoundNotice("เริ่มนับกองคำถามรอบนี้ใหม่แล้ว");
  }, [currentQuestion]);

  const selectedCategory =
    categories.find((category) => category.slug === selectedSlug) ?? allCategory;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 text-ink-900 sm:px-6 lg:px-8">
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

      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <header className="sketchy-panel bg-paper-50/90 p-6">
            <div className="inline-flex rotate-[-1deg] items-center gap-2 rounded-full border-2 border-ink-800 bg-doodle-lemon px-3 py-1 font-hand text-sm font-bold shadow-sketch-soft">
              <Sparkles className="h-4 w-4" aria-hidden />
              <span>พื้นที่คุยแบบใจเย็น</span>
            </div>
            <h1 className="mt-5 font-hand text-5xl font-bold leading-tight tracking-normal text-ink-900">
              KhuiDeep
              <span className="block text-3xl">คุยดีพ</span>
            </h1>
            <p className="mt-4 text-base leading-8 text-ink-700">
              การ์ดคำถามภาษาไทยสำหรับเปิดบทสนทนาที่จริงใจ อบอุ่น และฟังกันลึกขึ้น
            </p>
          </header>

          <CategoryTabs
            categories={categories}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
            counts={counts}
          />
        </aside>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-note border-2 border-dashed border-ink-800/45 bg-paper-50/65 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 rotate-[-3deg] items-center justify-center rounded-full border-2 border-ink-800 shadow-sketch-soft"
                style={{ backgroundColor: selectedCategory.accent }}
              >
                <BookOpenText className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="font-hand text-2xl font-bold leading-tight">
                  {selectedCategory.name}
                </p>
                <p className="text-sm leading-6 text-ink-700">
                  เหลืออีก {remainingCount} ใบในรอบนี้
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={drawQuestion}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-peach px-4 py-3 font-hand text-lg font-bold shadow-sketch-soft transition",
                  "hover:-translate-y-0.5 hover:rotate-[-0.6deg] focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon",
                )}
              >
                <Shuffle className="h-5 w-5" aria-hidden />
                <span>สุ่มคำถาม</span>
              </button>
              <button
                type="button"
                onClick={resetRound}
                className="inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-3 font-hand text-lg font-bold shadow-sketch-soft transition hover:-translate-y-0.5 hover:rotate-[0.6deg] focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon"
              >
                <RotateCcw className="h-5 w-5" aria-hidden />
                <span>เริ่มรอบใหม่</span>
              </button>
            </div>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="tape relative mx-auto w-full max-w-2xl animate-ink-pop">
              <FlippingCard
                question={currentQuestion}
                category={currentCategory}
                isFlipped={isFlipped}
                onToggle={() => setIsFlipped((value) => !value)}
              />
            </div>

            <div className="space-y-4">
              <div className="sketchy-panel bg-white/84 p-5 paper-tilt-right">
                <p className="font-hand text-xl font-bold">จังหวะของการ์ดนี้</p>
                <p className="mt-3 text-sm leading-7 text-ink-700">
                  ถ้าคำถามหนักเกินไป ให้พัก หายใจ แล้วเลือกใบใหม่ได้เสมอ
                </p>
              </div>

              <div className="sketchy-panel bg-doodle-mint/70 p-5 paper-tilt-left">
                <div className="flex items-center gap-2 font-hand text-xl font-bold">
                  <RefreshCw className="h-5 w-5" aria-hidden />
                  <span>สถานะกองคำถาม</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink-700">
                  ใช้ไปแล้ว {usedIds.size} จาก {questionPool.length} ใบ
                </p>
                {roundNotice ? (
                  <p className="mt-3 rounded-note border border-ink-800 bg-white px-3 py-2 text-sm font-semibold leading-6">
                    {roundNotice}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
