"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  ArrowLeft,
  BookOpenText,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { FlippingCard } from "@/components/flipping-card";
import type { DeepQuestion, QuestionCategory, QuestionDeck } from "@/types";

type KhuiDeepPlayProps = {
  deck: QuestionDeck;
  categorySlug: string;
};

const allCategory: QuestionCategory = {
  id: "all",
  slug: "all",
  name: "ทั้งหมด",
  description: "รวมคำถามจากทุกหมวดหมู่ไว้ในกองเดียวสำหรับทุกความสัมพันธ์",
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

export function KhuiDeepPlay({ deck, categorySlug }: KhuiDeepPlayProps) {
  // Find current category
  const currentCategory = useMemo(() => {
    if (categorySlug === "all") {
      return allCategory;
    }
    return deck.categories.find((cat) => cat.slug === categorySlug) ?? allCategory;
  }, [deck.categories, categorySlug]);

  // Filter questions for the selected category
  const questionPool = useMemo(() => {
    if (categorySlug === "all") {
      return deck.questions;
    }
    return deck.questions.filter((question) => question.categorySlug === categorySlug);
  }, [deck.questions, categorySlug]);

  type CardItem = {
    id: string;
    question: DeepQuestion | null;
    state: "active" | "exiting" | "entering";
    isFlipped: boolean;
  };

  const [visibleCards, setVisibleCards] = useState<CardItem[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set());
  const [roundNotice, setRoundNotice] = useState("");

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeState, setSwipeState] = useState<
    "idle" | "swiping" | "swiping-away"
  >("idle");
  const dragStartX = useRef<number | null>(null);
  const swipeOffsetRef = useRef(0);
  const hasMoved = useRef(false);

  // Initialize first question on load / change of pool
  useEffect(() => {
    if (questionPool.length > 0) {
      const initial = questionPool[Math.floor(Math.random() * questionPool.length)];
      setVisibleCards([
        {
          id: `${initial.id}-${Date.now()}`,
          question: initial,
          state: "active",
          isFlipped: false,
        },
      ]);
      setUsedIds(new Set([initial.id]));
    } else {
      setVisibleCards([]);
      setUsedIds(new Set());
    }
    setRoundNotice("");
  }, [questionPool]);

  const remainingCount = Math.max(questionPool.length - usedIds.size, 0);

  const drawQuestion = useCallback((options?: { fromSwipe?: boolean }) => {
    const canDraw =
      swipeState === "idle" || (options?.fromSwipe === true && swipeState === "swiping");

    if (questionPool.length === 0 || !canDraw) {
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

    const activeCard = visibleCards.find((c) => c.state === "active");
    const nextQuestion = pickRandomQuestion(availableQuestions, activeCard?.question?.id);

    if (!nextQuestion) {
      return;
    }

    nextUsedIds.add(nextQuestion.id);
    setUsedIds(nextUsedIds);
    setRoundNotice(notice);

    setSwipeState("swiping-away");

    setVisibleCards((prev) => {
      const updated = prev.map((c) =>
        c.state === "active" ? { ...c, state: "exiting" as const } : c
      );
      return [
        ...updated,
        {
          id: `${nextQuestion.id}-${Date.now()}`,
          question: nextQuestion,
          state: "entering" as const,
          isFlipped: false,
        },
      ];
    });

    setTimeout(() => {
      setVisibleCards((prev) => {
        const entering = prev.find((c) => c.state === "entering");
        if (entering) {
          return [{ ...entering, state: "active" as const }];
        }
        return prev.filter((c) => c.state === "active");
      });
      setSwipeState("idle");
      swipeOffsetRef.current = 0;
      setSwipeOffset(0);
    }, 600);
  }, [questionPool, usedIds, visibleCards, swipeState]);

  const resetRound = useCallback(() => {
    if (questionPool.length === 0 || swipeState !== "idle") return;
    const nextQuestion = questionPool[Math.floor(Math.random() * questionPool.length)];
    if (!nextQuestion) return;

    setUsedIds(new Set([nextQuestion.id]));
    setRoundNotice("เริ่มนับกองคำถามรอบนี้ใหม่แล้ว");
    setSwipeState("swiping-away");

    setVisibleCards((prev) => {
      const updated = prev.map((c) =>
        c.state === "active" ? { ...c, state: "exiting" as const } : c
      );
      return [
        ...updated,
        {
          id: `${nextQuestion.id}-${Date.now()}`,
          question: nextQuestion,
          state: "entering" as const,
          isFlipped: false,
        },
      ];
    });

    setTimeout(() => {
      setVisibleCards((prev) => {
        const entering = prev.find((c) => c.state === "entering");
        if (entering) {
          return [{ ...entering, state: "active" as const }];
        }
        return prev.filter((c) => c.state === "active");
      });
      setSwipeState("idle");
      swipeOffsetRef.current = 0;
      setSwipeOffset(0);
    }, 600);
  }, [questionPool, swipeState]);

  const handleDragStart = useCallback((clientX: number) => {
    if (swipeState !== "idle") return;
    dragStartX.current = clientX;
    swipeOffsetRef.current = 0;
    setSwipeState("swiping");
    hasMoved.current = false;
  }, [swipeState]);

  const handleDragMove = useCallback((clientX: number) => {
    if (dragStartX.current === null || swipeState !== "swiping") return;
    const deltaX = clientX - dragStartX.current;
    const limitedDeltaX = deltaX > 0 ? deltaX * 0.25 : deltaX;

    if (Math.abs(deltaX) > 10) {
      hasMoved.current = true;
    }
    swipeOffsetRef.current = limitedDeltaX;
    setSwipeOffset(limitedDeltaX);
  }, [swipeState]);

  const handleDragEnd = useCallback(() => {
    if (dragStartX.current === null) return;
    dragStartX.current = null;

    if (hasMoved.current && swipeOffsetRef.current < -120) {
      drawQuestion({ fromSwipe: true });
    } else {
      setSwipeState("idle");
      swipeOffsetRef.current = 0;
      setSwipeOffset(0);
    }
  }, [drawQuestion]);

  const animateNextCard = useCallback(() => {
    drawQuestion();
  }, [drawQuestion]);

  const animateResetCard = useCallback(() => {
    resetRound();
  }, [resetRound]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    if (dragStartX.current !== null) {
      handleDragEnd();
    }
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (dragStartX.current !== null) {
      handleDragEnd();
    }
  }, [handleDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleDragStart(touch.clientX);
    }
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleDragMove(touch.clientX);
    }
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    if (dragStartX.current !== null) {
      handleDragEnd();
    }
  }, [handleDragEnd]);

  const cardStyle = useCallback((card: CardItem) => {
    if (card.state === "active") {
      let transform = "translateX(0) rotate(0) scale(1)";
      let opacity = 1;
      let transition = "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s";
      let cursor = "grab";

      if (swipeState === "swiping") {
        transform = `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.04}deg)`;
        opacity = 1;
        transition = "none";
        cursor = "grabbing";
      }

      return {
        transform,
        opacity,
        transition,
        cursor,
      };
    } else if (card.state === "exiting") {
      return {
        "--exit-start-x": `${swipeOffset}px`,
        "--exit-start-rotate": `${swipeOffset * 0.04}deg`,
        cursor: "default",
        zIndex: 10,
      } as React.CSSProperties;
    } else if (card.state === "entering") {
      return {
        cursor: "default",
        zIndex: 20,
      };
    }
    return {};
  }, [swipeState, swipeOffset]);


  // Accent gradient based on the selected category's accent color
  const dynamicBackgroundGradient = useMemo(() => {
    return {
      background: `
        radial-gradient(circle at top left, ${currentCategory.accent}4d, transparent 36rem),
        radial-gradient(circle at 85% 15%, ${currentCategory.accent}33, transparent 28rem),
        linear-gradient(90deg, rgba(47, 41, 37, 0.035) 1px, transparent 1px),
        linear-gradient(rgba(47, 41, 37, 0.035) 1px, transparent 1px),
        #fffdf7
      `,
      backgroundSize: "auto, auto, 32px 32px, 32px 32px, auto",
    };
  }, [currentCategory.accent]);

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-6 text-ink-900 sm:px-6 lg:px-8 transition-colors duration-500"
      style={dynamicBackgroundGradient}
    >
      {/* Decorative background illustrations */}
      <Image
        src="/sketch-notes.svg"
        alt=""
        width={360}
        height={260}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 hidden w-56 rotate-2 opacity-80 sm:block lg:right-12 lg:top-8"
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Navigation Bar */}
        <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-2.5 font-hand text-lg font-bold shadow-sketch-soft transition duration-200 hover:-translate-y-0.5 hover:rotate-[-0.6deg] focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>กลับไปเลือกหมวดหมู่</span>
          </Link>

          <div
            className="inline-flex rotate-[0.5deg] items-center gap-2 rounded-full border-2 border-ink-800 px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
            style={{ backgroundColor: currentCategory.accent }}
          >
            <Sparkles className="h-5 w-5 animate-pulse text-ink-900" />
            <span>หมวดหมู่: {currentCategory.name}</span>
          </div>
        </nav>

        {/* Playroom Title & Summary */}
        <header className="mb-6 rounded-note border-2 border-dashed border-ink-800/40 bg-paper-50/60 p-5">
          <h1 className="font-hand text-3xl font-bold text-ink-900 sm:text-4xl">
            กำลังสุ่มการ์ด: {currentCategory.name}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            {currentCategory.description}
          </p>
        </header>

        {/* Card Arena & Info Sidebar Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
          {/* Card Play Zone */}
          <section className="space-y-6">
            <div className="relative mx-auto w-full max-w-2xl min-h-[410px] sm:min-h-[450px]">
              {/* Stack Background Cards (Visual Decoration) */}
              <div className="absolute inset-0 transform translate-y-2.5 translate-x-1.5 rotate-[1.5deg] scale-[0.985] border-2 border-ink-800 rounded-[31px_25px_34px_23px] bg-paper-50/70 shadow-sketch-soft pointer-events-none z-0" />
              <div className="absolute inset-0 transform translate-y-5 translate-x-[-2px] rotate-[-2deg] scale-[0.97] border-2 border-ink-800 rounded-[31px_25px_34px_23px] bg-paper-50/40 shadow-sketch-soft pointer-events-none z-0" />

              {/* Render Visible Cards */}
              {visibleCards.map((card) => {
                const isActive = card.state === "active";
                const isExiting = card.state === "exiting";
                const isEntering = card.state === "entering";

                return (
                  <div
                    key={card.id}
                    className={clsx(
                      "tape absolute inset-0 w-full select-none touch-pan-y z-10",
                      isEntering && "card-enter",
                      isExiting && "card-exit"
                    )}
                    onMouseDown={isActive ? handleMouseDown : undefined}
                    onMouseMove={isActive ? handleMouseMove : undefined}
                    onMouseUp={isActive ? handleMouseUp : undefined}
                    onMouseLeave={isActive ? handleMouseLeave : undefined}
                    onTouchStart={isActive ? handleTouchStart : undefined}
                    onTouchMove={isActive ? handleTouchMove : undefined}
                    onTouchEnd={isActive ? handleTouchEnd : undefined}
                    style={cardStyle(card)}
                  >
                    <FlippingCard
                      question={card.question}
                      category={currentCategory}
                      isFlipped={card.isFlipped}
                      onToggle={() => {
                        if (isActive && swipeState === "idle" && !hasMoved.current) {
                          setVisibleCards((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, isFlipped: !c.isFlipped } : c
                            )
                          );
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <p className="text-center font-hand text-base text-ink-600 animate-pulse mt-2">
              💡 ปัดการ์ดไปทางซ้ายเพื่อเปลี่ยนใบใหม่ได้นะ!
            </p>

            {/* Main Action Controllers */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={animateNextCard}
                disabled={questionPool.length === 0 || swipeState !== "idle"}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-note border-2 border-ink-800 px-6 py-3.5 font-hand text-xl font-bold shadow-sketch-soft transition duration-200",
                  "hover:-translate-y-0.5 hover:rotate-[-0.6deg] focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon active:translate-y-0",
                  (questionPool.length === 0 || swipeState !== "idle")
                    ? "bg-ink-200/50 cursor-not-allowed opacity-50"
                    : "bg-doodle-peach hover:bg-doodle-peach/90",
                )}
                style={{
                  backgroundColor: (questionPool.length > 0 && swipeState === "idle") ? currentCategory.accent : undefined,
                }}
              >
                <Shuffle className="h-5 w-5" aria-hidden />
                <span>สุ่มคำถามถัดไป</span>
              </button>
              <button
                type="button"
                onClick={animateResetCard}
                disabled={questionPool.length === 0 || swipeState !== "idle"}
                className="inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-5 py-3.5 font-hand text-lg font-bold shadow-sketch-soft transition duration-200 hover:-translate-y-0.5 hover:rotate-[0.6deg] focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-5 w-5" aria-hidden />
                <span>เริ่มนับกองใหม่</span>
              </button>
            </div>
          </section>

          {/* Right Info Panels */}
          <aside className="space-y-5">
            {/* Round Status Info */}
            <div className="sketchy-panel bg-white/90 p-5 paper-tilt-right">
              <div className="flex items-center gap-2 font-hand text-xl font-bold">
                <RefreshCw className="h-5 w-5 text-ink-800" aria-hidden />
                <span>สถานะกองคำถาม</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">
                ใช้ไปแล้ว <strong className="text-base text-ink-900">{usedIds.size}</strong> จากทั้งหมด{" "}
                <strong className="text-base text-ink-900">{questionPool.length}</strong> ใบ (เหลืออีก {remainingCount} ใบ)
              </p>

              {/* Graphical Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
                  <span>ความคืบหน้า</span>
                  <span>
                    {Math.round((usedIds.size / Math.max(questionPool.length, 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-paper-50 rounded-full border-2 border-ink-800 h-4 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(usedIds.size / Math.max(questionPool.length, 1)) * 100}%`,
                      backgroundColor: currentCategory.accent,
                    }}
                  />
                </div>
              </div>

              {roundNotice ? (
                <p className="mt-4 rounded-note border border-ink-800 bg-doodle-lemon/45 px-3 py-2 text-xs font-semibold leading-relaxed">
                  {roundNotice}
                </p>
              ) : null}
            </div>

            {/* Mindful Tips */}
            <div className="sketchy-panel bg-white/90 p-5 paper-tilt-left">
              <div className="flex items-center gap-2 font-hand text-xl font-bold text-ink-800">
                <BookOpenText className="h-5 w-5" aria-hidden />
                <span>จังหวะของการ์ดนี้</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">
                การตั้งใจฟังมีความหมายเท่ากับคำตอบ ถ้าคำถามหนักหน่วงเกินไป
                คุณสามารถเลือกพัก หายใจ แล้วจั่วใบใหม่ได้เสมอโดยไม่มีใครตัดสิน
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
