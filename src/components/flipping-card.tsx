"use client";

import { motion } from "framer-motion";
import { HeartHandshake, MessageCircleHeart, Smile, Sparkles } from "lucide-react";
import type { DeepQuestion, QuestionCategory } from "@/types";

type FlippingCardProps = {
  question: DeepQuestion | null;
  category: QuestionCategory | undefined;
  isFlipped: boolean;
  onToggle: () => void;
  assignedPlayer?: string | null;
};

export function FlippingCard({
  question,
  category,
  isFlipped,
  onToggle,
  assignedPlayer,
}: FlippingCardProps) {
  const accent = category?.accent ?? "#ffd5bd";
  const categoryName = category?.name ?? "คำถาม";

  return (
    <div
      role="button"
      tabIndex={0}
      className="card-scene block w-full h-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon cursor-pointer"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={isFlipped}
      aria-label={isFlipped ? "ปิดการ์ดคำถาม" : "เปิดการ์ดคำถาม"}
      style={{
        "--card-accent": accent,
      } as React.CSSProperties}
    >
      <motion.div
        className="relative w-full h-full min-h-[470px] sm:min-h-[520px]"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: "preserve-3d", touchAction: "pan-y" }}
        onTap={onToggle}
      >
        <article
          className="card-face doodle-grid justify-between bg-paper-50 p-7 sm:p-9"
          style={{ backgroundColor: accent }}
        >
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="font-hand text-xl font-bold text-ink-900">{categoryName}</p>
              <p className="mt-1 text-sm font-semibold text-ink-700">KhuiDeep คุยดีพ</p>
            </div>
            <span className="rounded-full border-2 border-ink-800 bg-paper-50 p-3 shadow-sketch-soft">
              <MessageCircleHeart className="h-6 w-6" aria-hidden />
            </span>
          </div>

          <div className="relative z-10 mx-auto flex h-40 w-40 rotate-[-2deg] items-center justify-center rounded-[45%_55%_48%_52%] border-2 border-dashed border-ink-800 bg-paper-50/78 shadow-tape">
            <span className="font-hand text-6xl font-bold text-ink-900">?</span>
          </div>

          <div className="relative z-10 text-center">
            <p className="font-hand text-2xl font-bold leading-relaxed text-ink-900 sm:text-3xl">
              แตะการ์ดเพื่อเปิดคำถาม
            </p>
            <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-ink-700">
              เว้นจังหวะให้ใจได้ตอบอย่างค่อยเป็นค่อยไป
            </p>
          </div>
        </article>

        <article className="card-face card-back justify-between bg-paper-50 p-7 sm:p-9 pb-10 sm:pb-12">
          <div className="relative z-10 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span
                className="rounded-full border-2 border-ink-800 px-4 py-1.5 font-hand text-base font-bold shadow-sketch-soft"
                style={{ backgroundColor: accent }}
              >
                {categoryName}
              </span>
              <HeartHandshake className="h-7 w-7 text-ink-800" aria-hidden />
            </div>

            {assignedPlayer && (
              <div className="player-turn-badge self-start inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-lemon px-3 py-1.5 font-hand text-base font-bold shadow-sketch-soft text-ink-900">
                <Smile className="h-5 w-5" aria-hidden />
                <span>คำถามนี้</span>
                <span className="player-turn-name mx-1 rounded px-1.5 py-0.5 border border-ink-800 bg-white text-ink-900 underline decoration-wavy decoration-ink-800/60">
                  {assignedPlayer}
                </span>
                <span>ต้องตอบ!</span>
                <Sparkles className="h-4.5 w-4.5 animate-pulse" aria-hidden />
              </div>
            )}
          </div>

          <div className="relative z-10 my-6 shrink-0">
            <p className="font-hand text-2xl font-bold !leading-[1.6] text-ink-900 sm:text-3xl md:text-4xl">
              {question?.question ?? "ยังไม่มีคำถามในหมวดนี้"}
            </p>
            {question?.helperText ? (
              <p className="mt-5 border-l-4 border-ink-800 bg-doodle-lemon/45 px-4 py-3 text-base leading-8 text-ink-800 sm:text-lg">
                {question.helperText}
              </p>
            ) : null}
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 shrink-0">
            {question?.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-ink-800 bg-white px-3 py-1 text-sm font-semibold text-ink-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>
      </motion.div>
    </div>
  );
}
