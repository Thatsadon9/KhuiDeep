"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { HeartHandshake, MessageCircleHeart, Smile, Sparkles } from "lucide-react";
import type { DeepQuestion, QuestionCategory } from "@/types";

type FlippingCardProps = {
  question: DeepQuestion | null;
  category: QuestionCategory | undefined;
  isFlipped: boolean;
  isInterestingMode?: boolean;
  onToggle: () => void;
  assignedPlayer?: string | null;
};

type WordSegment = {
  segment: string;
  isWordLike?: boolean;
};

type SegmenterLike = {
  segment(text: string): Iterable<WordSegment>;
};

type SegmenterConstructor = new (
  locale: string,
  options: { granularity: "word" },
) => SegmenterLike;

const thaiTextPattern = /[\u0E00-\u0E7F]/;
const thaiKaranPattern = /\u0E4C/;

function normalizeThaiWordSegments(parts: WordSegment[]) {
  const normalized: Array<WordSegment & { mergeNextThai?: boolean }> = [];

  parts.forEach((part) => {
    const hasThaiText = thaiTextPattern.test(part.segment);
    const hasKaran = thaiKaranPattern.test(part.segment);
    const previous = normalized[normalized.length - 1];

    if (
      part.isWordLike &&
      hasThaiText &&
      previous?.isWordLike &&
      thaiTextPattern.test(previous.segment) &&
      (hasKaran || previous.mergeNextThai)
    ) {
      previous.segment += part.segment;
      previous.mergeNextThai = hasKaran;
      return;
    }

    normalized.push({
      ...part,
      mergeNextThai: part.isWordLike && hasThaiText && hasKaran,
    });
  });

  return normalized;
}

function segmentQuestionText(text: string) {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor })
    .Segmenter;

  if (!Segmenter) {
    return text;
  }

  const segmenter = new Segmenter("th", { granularity: "word" });

  return normalizeThaiWordSegments(Array.from(segmenter.segment(text))).map((part, index) => {
    if (!part.isWordLike || /^\s+$/.test(part.segment)) {
      return part.segment;
    }

    return (
      <span className="question-word-segment" key={`${part.segment}-${index}`}>
        {part.segment}
      </span>
    );
  });
}

export function FlippingCard({
  question,
  category,
  isFlipped,
  isInterestingMode = false,
  onToggle,
  assignedPlayer,
}: FlippingCardProps) {
  const accent = category?.accent ?? "#ffd5bd";
  const categoryName = category?.name ?? "คำถาม";
  const questionText = question?.question ?? "ยังไม่มีคำถามในหมวดนี้";
  const questionLength = questionText.length;
  const isLongQuestion = questionLength > 150;
  const isVeryLongQuestion = questionLength > 260;
  const isExtraLongQuestion = questionLength > 360;
  const lineBreakSafeQuestionText = segmentQuestionText(questionText);
  const lineBreakSafeHelperText = question?.helperText
    ? segmentQuestionText(question.helperText)
    : null;

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
          className={clsx(
            "card-face doodle-grid justify-between bg-paper-50 p-7 sm:p-9",
            isInterestingMode && "card-face--interesting card-face--interesting-front",
          )}
          style={{ backgroundColor: accent }}
        >
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className={clsx("font-hand text-xl font-bold text-ink-900", isInterestingMode && "interesting-card-title")}>{categoryName}</p>
              <p className="mt-1 text-sm font-semibold text-ink-700">KhuiDeep คุยดีพ</p>
            </div>
            <span className={clsx("rounded-full border-2 border-ink-800 bg-paper-50 p-3 shadow-sketch-soft", isInterestingMode && "interesting-card-corner")}>
              <MessageCircleHeart className="h-6 w-6" aria-hidden />
            </span>
          </div>

          <div className={clsx("relative z-10 mx-auto flex h-40 w-40 rotate-[-2deg] items-center justify-center rounded-[45%_55%_48%_52%] border-2 border-dashed border-ink-800 bg-paper-50/78 shadow-tape", isInterestingMode && "interesting-question-mark")}>
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

        <article className={clsx("card-face card-back justify-between gap-4 bg-paper-50 p-7 pb-10 sm:p-9 sm:pb-12", isInterestingMode && "card-face--interesting card-face--interesting-back")}>
          <div className="relative z-10 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span
                className={clsx("rounded-full border-2 border-ink-800 px-4 py-1.5 font-hand text-base font-bold shadow-sketch-soft", isInterestingMode && "interesting-card-badge")}
                style={{ backgroundColor: accent }}
              >
                {categoryName}
              </span>
              <HeartHandshake className={clsx("h-7 w-7 text-ink-800", isInterestingMode && "interesting-card-corner-icon")} aria-hidden />
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

          <div className="card-question-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 sm:pr-3">
            <p
              className={clsx(
                "card-question-text font-hand font-bold text-ink-900",
                isExtraLongQuestion
                  ? "text-lg !leading-[1.4] sm:text-xl md:text-2xl"
                  : isVeryLongQuestion
                    ? "text-xl !leading-[1.42] sm:text-2xl md:text-[1.65rem]"
                    : isLongQuestion
                      ? "text-[1.45rem] !leading-[1.48] sm:text-[1.7rem] md:text-[2rem]"
                      : "text-2xl !leading-[1.6] sm:text-3xl md:text-4xl",
              )}
            >
              {lineBreakSafeQuestionText}
            </p>
            {question?.helperText ? (
              <p className={clsx("mt-5 border-l-4 border-ink-800 bg-doodle-lemon/45 px-4 py-3 text-base leading-8 text-ink-800 sm:text-lg", isInterestingMode && "interesting-helper-note")}>
                {lineBreakSafeHelperText}
              </p>
            ) : null}
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 shrink-0">
            {question?.tags.map((tag) => (
              <span
                key={tag}
                className={clsx("rounded-full border border-ink-800 bg-white px-3 py-1 text-sm font-semibold text-ink-700", isInterestingMode && "interesting-tag")}
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
