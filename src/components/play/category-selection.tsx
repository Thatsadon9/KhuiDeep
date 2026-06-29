"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  MessageCircle,
  Heart,
  History,
  Users,
  Layers,
  ArrowRight,
  ChevronLeft,
  Gauge,
  Home,
  MessagesSquare,
  UserRound,
  X,
  HeartHandshake,
  Rocket,
  Atom,
  Bot,
  BrainCircuit,
  Orbit,
  Telescope,
  Zap,
  Globe,
  Timer,
  Lightbulb,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModeTransitionOverlay } from "@/components/play/mode-transition";
import {
  defaultTalkModeId,
  filterQuestionsByTalkMode,
  type TalkModeId,
} from "@/lib/talk-modes";
import type { QuestionCategory, QuestionDeck } from "@/types";
import { trackEventAsync } from "@/lib/analytics";

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
  talkModes: ["deep", "interesting"],
};

function getCategoryIcon(slug: string, mode: TalkModeId) {
  if (mode === "interesting") {
    switch (slug) {
      case "all":
        return <Orbit className="h-6 w-6" />;
      case "weird-ideas":
        return <Telescope className="h-6 w-6" />;
      case "parallel-world":
        return <Atom className="h-6 w-6" />;
      case "human-analysis":
        return <BrainCircuit className="h-6 w-6" />;
      case "suppose":
        return <Bot className="h-6 w-6" />;
      case "weird-world":
        return <Globe className="h-6 w-6" />;
      case "unborn-future":
        return <Timer className="h-6 w-6" />;
      case "awake-philosophy":
        return <Lightbulb className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  } else {
    switch (slug) {
      case "all":
        return <Layers className="h-6 w-6" />;
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
}

function UfoStickerIcon() {
  return (
    <svg
      viewBox="0 0 84 58"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M28 29c4.2-11 23.5-11.4 28 0"
        fill="#d8b4fe"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <path
        d="M10 31c11-7.5 52-7.5 64 0-4.2 10.5-59.2 10.4-64 0Z"
        fill="#a7f3d0"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <path
        d="M24 38c7 8 29 8 36 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M26 46l-7 8M42 47l-1 9M58 46l7 8"
        stroke="#7dd3fc"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="27" cy="32" r="2.5" fill="#2f2925" />
      <circle cx="42" cy="34" r="2.5" fill="#2f2925" />
      <circle cx="57" cy="32" r="2.5" fill="#2f2925" />
    </svg>
  );
}

function PixelQuestionIcon() {
  return (
    <svg
      viewBox="0 0 52 52"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <path
        d="M14 8h24v6h6v14h-6v6H28v6H18V28h12v-4h4V18H18v6H8V14h6V8Zm4 34h10v8H18v-8Z"
        fill="#c4b5fd"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function getDisplayCategory(
  category: QuestionCategory,
  mode: TalkModeId,
) {
  if (category.slug === "all") {
    if (mode === "interesting") {
      return {
        name: "จักรวาลคำถามทั้งหมด",
        description: "รวมกองคำถามสายจินตนาการ ไว้สุ่มเปิดประตูไปทุกความเป็นไปได้",
        accent: "#ffd1f3",
        icon: getCategoryIcon("all", "interesting"),
      };
    } else {
      return {
        name: "ทั้งหมด",
        description: "รวมคำถามจากทุกหมวดหมู่ไว้ในกองเดียวสำหรับทุกความสัมพันธ์",
        accent: "#ffd5bd",
        icon: getCategoryIcon("all", "deep"),
      };
    }
  }

  return {
    name: category.name,
    description: category.description,
    accent: category.accent,
    icon: getCategoryIcon(category.slug, mode),
  };
}

// Custom rotation classes to give a realistic hand-drawn/scattered layout
const tilts = [
  "rotate-[-1.5deg] hover:rotate-[0.5deg]",
  "rotate-[1deg] hover:rotate-[-0.5deg]",
  "rotate-[-1deg] hover:rotate-[1deg]",
  "rotate-[2deg] hover:rotate-[-1deg]",
  "rotate-[-2deg] hover:rotate-[1.5deg]",
];

const depthOptions = [
  {
    value: 1,
    label: "เบา ๆ",
    caption: "อุ่นเครื่อง คุยง่าย",
    accent: "#ccebd9",
  },
  {
    value: 2,
    label: "กำลังดี",
    caption: "เริ่มเปิดใจนิด ๆ",
    accent: "#f7e7a7",
  },
  {
    value: 3,
    label: "ลึกขึ้น",
    caption: "แตะเรื่องข้างในมากขึ้น",
    accent: "#b9d9f2",
  },
  {
    value: 5,
    label: "ลึกสุดใจ",
    caption: "เปิดได้ทุกระดับ",
    accent: "#f3b8c6",
  },
];

const audienceOptions = [
  {
    value: "self",
    label: "เล่นคนเดียว",
    icon: UserRound,
  },
  {
    value: "friends",
    label: "เพื่อน",
    icon: Users,
  },
  {
    value: "talking_stage",
    label: "คนคุย / กำลังจีบ",
    icon: MessagesSquare,
  },
  {
    value: "couple",
    label: "แฟน / คู่รัก",
    icon: Heart,
  },
  {
    value: "family",
    label: "ครอบครัว",
    icon: Home,
  },
];

const talkModeOptions = [
  {
    id: "deep" as const,
    label: "โหมดอบอุ่นใจ",
    shortLabel: "Deep Talk",
    icon: HeartHandshake,
    accentClass: "bg-doodle-lemon",
    hoverClass: "hover:bg-doodle-lemon/65",
    rotate: "-0.7deg",
  },
  {
    id: "interesting" as const,
    label: "โหมดคุยเปิดโลก",
    shortLabel: "Interesting Talk",
    icon: Rocket,
    accentClass: "bg-[#ffd1f3]",
    hoverClass: "hover:bg-[#d7fdf0]",
    rotate: "0.7deg",
  },
];

const interestingDepthOptions = [
  {
    value: 3,
    label: "สปาร์กไอเดีย",
    caption: "แปลกพอดี ให้สมองเริ่มยิ้ม",
    accent: "#7dd3fc",
  },
  {
    value: 4,
    label: "หลุดวงโคจร",
    caption: "คำถามเริ่มกวนและชวนคิดไกล",
    accent: "#c4b5fd",
  },
  {
    value: 5,
    label: "จักรวาลแตก",
    caption: "เปิดทุกความเป็นไปได้แบบไม่ห้ามจินตนาการ",
    accent: "#5eead4",
  },
];

export function CategorySelection({ deck }: CategorySelectionProps) {
  const router = useRouter();
  const [setupCategory, setSetupCategory] = useState<QuestionCategory | null>(null);
  const [setupStep, setSetupStep] = useState<"depth" | "audience">("depth");
  const [selectedDepth, setSelectedDepth] = useState<number | null>(null);
  const [selectedTalkMode, setSelectedTalkMode] =
    useState<TalkModeId>(defaultTalkModeId);
  const [transitionMode, setTransitionMode] = useState<TalkModeId | null>(null);

  const categories = useMemo(() => {
    const modeCategories = deck.categories.filter((cat) =>
      cat.talkModes?.includes(selectedTalkMode)
    );
    return [allCategory, ...modeCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [deck.categories, selectedTalkMode]);

  const modeQuestions = useMemo(
    () => filterQuestionsByTalkMode(deck.questions, selectedTalkMode),
    [deck.questions, selectedTalkMode],
  );

  const counts = useMemo(() => {
    return modeQuestions.reduce<Record<string, number>>(
      (accumulator, question) => {
        accumulator[allCategory.slug] += 1;
        accumulator[question.categorySlug] = (accumulator[question.categorySlug] ?? 0) + 1;
        return accumulator;
      },
      { [allCategory.slug]: 0 },
    );
  }, [modeQuestions]);

  const setupQuestionPool = useMemo(() => {
    if (!setupCategory) return [];
    if (setupCategory.slug === allCategory.slug) return modeQuestions;
    return modeQuestions.filter((question) => question.categorySlug === setupCategory.slug);
  }, [modeQuestions, setupCategory]);

  useEffect(() => {
    void trackEventAsync("page_view", {
      talk_mode: selectedTalkMode,
      page_path: "/",
    });
  }, [selectedTalkMode]);

  const openSetup = (category: QuestionCategory) => {
    setSetupCategory(category);
    setSetupStep("depth");
    setSelectedDepth(null);
  };

  const closeSetup = () => {
    setSetupCategory(null);
    setSetupStep("depth");
    setSelectedDepth(null);
  };

  const chooseDepth = (depth: number) => {
    setSelectedDepth(depth);
    setSetupStep("audience");
  };

  const chooseAudience = async (audience: string) => {
    if (!setupCategory || !selectedDepth) return;

    const params = new URLSearchParams({
      mode: selectedTalkMode,
      depth: String(selectedDepth),
      audience,
    });

    await trackEventAsync("play_start", {
      talk_mode: selectedTalkMode,
      category_slug: setupCategory.slug,
      depth: selectedDepth,
      audience,
      page_path: "/",
    });

    router.push(`/play/${setupCategory.slug}?${params.toString()}`);
  };

  const countForDepth = (depth: number) =>
    setupQuestionPool.filter((question) => question.level <= depth).length;

  const countForAudience = (audience: string) =>
    setupQuestionPool.filter(
      (question) =>
        (!selectedDepth || question.level <= selectedDepth) &&
        question.audience.includes(audience),
    ).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 55, scale: 0.8, rotate: -2 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 13,
        mass: 0.8,
      },
    },
  };

  const isInterestingMode = selectedTalkMode === "interesting";
  const activeDepthOptions = isInterestingMode ? interestingDepthOptions : depthOptions;
  const setupDisplayCategory =
    setupCategory
      ? getDisplayCategory(setupCategory, selectedTalkMode)
      : null;

  return (
    <main
      className={clsx(
        "relative min-h-screen overflow-hidden px-4 py-8 text-ink-900 sm:px-6 lg:px-8",
        isInterestingMode && "interesting-talk-mode",
      )}
    >
      {/* Theme Switcher Button */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6 lg:right-12 lg:top-8">
        <ThemeToggle />
      </div>

      {/* Decorative background elements */}
      {isInterestingMode ? (
        <div className="cyber-sticker-cluster" aria-hidden="true">
          <span className="cyber-sticker cyber-sticker-ufo">
            <UfoStickerIcon />
          </span>
          <span className="cyber-sticker cyber-sticker-zap">
            <Zap className="h-9 w-9" />
          </span>
          <span className="cyber-sticker cyber-sticker-pixel">
            <PixelQuestionIcon />
          </span>
        </div>
      ) : (
        <Image
          src="/sketch-notes.svg"
          alt=""
          width={360}
          height={260}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 hidden w-56 rotate-2 opacity-80 sm:block lg:right-12 lg:top-8"
        />
      )}
      <div
        className={clsx(
          "pointer-events-none absolute -left-24 top-44 h-48 w-48 rotate-12 rounded-[42%_58%_47%_53%] border-2 border-dashed border-ink-800/20",
          isInterestingMode ? "bg-[#7dd3fc]/30" : "bg-doodle-sky/30",
        )}
      />
      <div
        className={clsx(
          "pointer-events-none absolute bottom-10 right-4 h-32 w-32 rotate-[-10deg] rounded-[55%_45%_50%_50%] border-2 border-dashed border-ink-800/20",
          isInterestingMode ? "bg-[#c4b5fd]/35" : "bg-doodle-mint/40",
        )}
      />

      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <header className="mx-auto mb-8 max-w-2xl text-center">
          <div
            className={clsx(
              "inline-flex rotate-[-1.5deg] items-center gap-2 rounded-full border-2 border-ink-800 px-4 py-1.5 font-hand text-base font-bold shadow-sketch-soft",
              isInterestingMode ? "interesting-mode-badge" : "bg-doodle-lemon",
            )}
          >
            {isInterestingMode ? (
              <Zap className="interesting-mode-badge-icon h-5 w-5 animate-pulse" aria-hidden />
            ) : (
              <Sparkles className="h-5 w-5 animate-pulse text-ink-900" aria-hidden />
            )}
            <span>{isInterestingMode ? "พื้นที่ทดลองไอเดีย" : "พื้นที่คุยแบบใจเย็น"}</span>
          </div>
          <h1 className="mt-6 font-hand text-5xl font-bold leading-tight tracking-normal text-ink-900 sm:text-7xl">
            KhuiDeep
            <span className="block text-4xl mt-1 text-ink-800 font-medium">คุยดีพ</span>
          </h1>
          <p className="mt-6 font-hand text-xl leading-relaxed text-ink-700">
            {isInterestingMode
              ? "การ์ดคำถามภาษาไทยสำหรับปล่อยจินตนาการ คุยเปิดโลก และลองคิดแบบไม่อยู่ในโลกเดิม"
              : "การ์ดคำถามภาษาไทยสำหรับเปิดบทสนทนาที่จริงใจ อบอุ่น และฟังกันลึกขึ้น"}
            <span className="block mt-1 text-sm font-body text-ink-500">
              {isInterestingMode
                ? "เลือกภารกิจด้านล่าง แล้วขึ้นยานไปทดลองความเป็นไปได้ใหม่ ๆ"
                : "เลือกหมวดหมู่คำถามด้านล่างเพื่อเริ่มการเดินทางในบทสนทนา"}
            </span>
          </p>
        </header>

        <div className="mx-auto mb-11 flex w-full max-w-2xl justify-center px-1">
          <div
            className={clsx(
              "mode-switch-sticker grid w-full grid-cols-2 rounded-full border-2 border-ink-800 bg-paper-50/88 p-1.5 shadow-sketch-soft",
              isInterestingMode && "mode-switch-sticker--cyber",
            )}
            role="radiogroup"
            aria-label="เลือกโหมดบทสนทนา"
          >
            {talkModeOptions.map((mode) => {
              const isSelected = selectedTalkMode === mode.id;
              const Icon = mode.icon;

              return (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    if (mode.id !== selectedTalkMode && !transitionMode) {
                      setTransitionMode(mode.id);
                    }
                  }}
                  className={clsx(
                    "btn-doodle flex min-h-[68px] min-w-0 items-center justify-center gap-2 rounded-full border-2 px-2.5 py-2 text-center transition sm:gap-3 sm:px-4",
                    isSelected
                      ? [
                          mode.accentClass,
                          "border-ink-800 text-ink-900 shadow-sketch-soft",
                          mode.id === "interesting" && "mode-switch-button--cyber-selected",
                        ]
                      : [
                          "border-transparent bg-transparent text-ink-700 shadow-none",
                          mode.hoverClass,
                        ],
                  )}
                  style={{
                    "--btn-hover-rotate": mode.rotate,
                    "--category-accent": mode.id === "deep" ? "#fde047" : "#ffd1f3",
                  } as React.CSSProperties}
                >
                  <span
                    className={clsx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink-800 bg-white shadow-sketch-soft sm:h-11 sm:w-11",
                      !isSelected && "bg-paper-50/80",
                    )}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                  </span>
                  <span className="min-w-0 leading-none">
                    <span className="block text-wrap font-hand text-base font-bold leading-tight sm:text-xl">
                      {mode.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-bold uppercase leading-tight text-ink-700 sm:text-xs">
                      {mode.shortLabel}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Grid */}
        <motion.section
          aria-label="เลือกหมวดหมู่คำถาม"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {categories.map((category, index) => {
            const tiltClass = tilts[index % tilts.length];
            const displayCategory = getDisplayCategory(category, selectedTalkMode);
            const count = counts[category.slug] ?? 0;
            const isEmpty = count === 0;

            return (
              <motion.div key={category.slug} variants={itemVariants}>
                <button
                  type="button"
                  disabled={isEmpty}
                  onClick={() => openSetup(category)}
                  className={clsx(
                    "group relative flex w-full flex-col justify-between min-h-[260px] p-6 text-left",
                    "sketchy-panel",
                    !isEmpty && "sketchy-panel-interactive",
                    isEmpty && "cursor-not-allowed opacity-60 saturate-[0.7]",
                    tiltClass,
                  )}
                  style={{
                    backgroundColor: "var(--panel-bg-override, rgba(255, 255, 255, 0.95))",
                    "--category-glow": displayCategory.accent,
                    "--category-glow-soft": `${displayCategory.accent}66`,
                    "--category-glow-alpha": `${displayCategory.accent}26`,
                  } as React.CSSProperties}
                >
                {/* Accent Color Band */}
                <div
                  className={clsx(
                    "absolute top-0 inset-x-0 h-3 rounded-tl-[22px] rounded-tr-[16px]",
                    isInterestingMode && "cyber-card-band",
                  )}
                  style={{ backgroundColor: displayCategory.accent }}
                  aria-hidden
                />

                {/* Card Top */}
                <div className="relative pt-3">
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon Box */}
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-800 shadow-sketch-soft transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1.1)] group-hover:rotate-[-8deg] group-hover:scale-105"
                      style={{ backgroundColor: displayCategory.accent }}
                    >
                      {displayCategory.icon}
                    </div>

                    {/* Count Badge */}
                    <span className="inline-block rounded-full border-2 border-ink-800 bg-white px-2.5 py-0.5 font-hand text-sm font-bold shadow-sketch-soft">
                      {count} ใบ
                    </span>
                  </div>

                  <h2 className="mt-5 font-hand text-2xl font-bold leading-tight text-ink-900 group-hover:text-ink-800">
                    {displayCategory.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">
                    {displayCategory.description}
                  </p>
                </div>

                {/* Card Bottom / CTA */}
                <div className="mt-6 border-t border-dashed border-ink-800/20 pt-4 flex items-center justify-between text-ink-800">
                  <span
                    className={clsx(
                      "font-hand text-lg font-bold flex items-center gap-1",
                      !isEmpty && "rough-underline",
                      isEmpty && "text-ink-500",
                    )}
                  >
                    {isEmpty ? (
                      "ยังไม่มีการ์ดโหมดนี้"
                    ) : (
                      <>
                        หยิบการ์ดหมวดนี้ <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1.1)] group-hover:scale-[1.7]"
                    style={{ backgroundColor: displayCategory.accent }}
                  />
                </div>
                </button>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Footer info note */}
        <footer className="mt-16 text-center text-xs text-ink-500 font-body">
          <p>© {new Date().getFullYear()} KhuiDeep — สนทนาอย่างเปิดใจและถนอมความรู้สึก</p>
        </footer>
      </div>

      <AnimatePresence>
        {setupCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 24, rotate: -0.8 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.92, y: 24, rotate: 0.8 }}
              transition={{ type: "spring", damping: 18, stiffness: 190 }}
              className="sketchy-panel w-full max-w-2xl overflow-hidden bg-paper-50 p-0 text-ink-900 shadow-sketch-strong flex flex-col max-h-[90vh]"
            >
              <div
                className="h-3 w-full shrink-0 border-b-2 border-ink-800"
                style={{ backgroundColor: setupDisplayCategory?.accent ?? setupCategory.accent }}
                aria-hidden
              />

              <div className="p-5 sm:p-6 overflow-y-auto">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink-800 bg-white px-3 py-1 font-hand text-sm font-bold shadow-sketch-soft">
                      {isInterestingMode ? (
                        <Zap className="h-4 w-4" aria-hidden />
                      ) : (
                        <Sparkles className="h-4 w-4" aria-hidden />
                      )}
                      <span>{setupDisplayCategory?.name ?? setupCategory.name}</span>
                    </div>
                    <h2 className="mt-4 font-hand text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
                      {setupStep === "depth"
                        ? isInterestingMode
                          ? "วันนี้อยากคุยเปิดโลกระดับไหน?"
                          : "วันนี้อยากคุยลึกแค่ไหน?"
                        : isInterestingMode
                          ? "ชวนใครขึ้นยาน?"
                          : "เล่นอยู่กับใคร?"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeSetup}
                    className="btn-doodle flex h-11 w-11 shrink-0 items-center justify-center rounded-note border-2 border-ink-800 bg-white shadow-sketch-soft"
                    style={{ "--btn-hover-rotate": "1deg" } as React.CSSProperties}
                    aria-label="ปิดหน้าต่าง"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <span
                    className={clsx(
                      "h-2.5 flex-1 rounded-full border border-ink-800",
                      setupStep === "depth" ? "bg-ink-900" : "bg-doodle-mint",
                    )}
                  />
                  <span
                    className={clsx(
                      "h-2.5 flex-1 rounded-full border border-ink-800",
                      setupStep === "audience" ? "bg-ink-900" : "bg-white",
                    )}
                  />
                </div>

                <div className="relative mt-6 min-h-[330px] overflow-hidden p-2 -m-2">
                  <AnimatePresence mode="wait">
                    {setupStep === "depth" ? (
                      <motion.div
                        key="depth"
                        initial={{ opacity: 0, x: -36 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -36 }}
                        transition={{ duration: 0.22 }}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        {activeDepthOptions.map((option) => {
                          const count = countForDepth(option.value);
                          const isDisabled = count === 0;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => chooseDepth(option.value)}
                              className={clsx(
                                "btn-doodle rounded-note border-2 border-ink-800 bg-white p-4 text-left shadow-sketch-soft transition disabled:cursor-not-allowed disabled:opacity-45",
                                !isDisabled && "hover:-translate-y-0.5",
                              )}
                              style={{
                                "--btn-hover-rotate": "-0.5deg",
                              } as React.CSSProperties}
                            >
                              <span
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink-800 shadow-sketch-soft"
                                style={{ backgroundColor: option.accent }}
                              >
                                <Gauge className="h-5 w-5" aria-hidden />
                              </span>
                              <span className="mt-3 block font-hand text-2xl font-bold text-ink-900">
                                {option.label}
                              </span>
                              <span className="mt-1 block text-sm leading-6 text-ink-700">
                                {option.caption}
                              </span>
                              <span className="mt-3 inline-flex rounded-full border border-ink-800 bg-paper-50 px-2.5 py-0.5 text-sm font-bold text-ink-800">
                                {count} ใบ
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="audience"
                        initial={{ opacity: 0, x: 44 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 44 }}
                        transition={{ duration: 0.24 }}
                        className="space-y-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          {audienceOptions.map((option) => {
                            const count = countForAudience(option.value);
                            const Icon = option.icon;
                            const isDisabled = count === 0;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => chooseAudience(option.value)}
                                className={clsx(
                                  "btn-doodle flex items-center justify-between gap-3 rounded-note border-2 border-ink-800 bg-white p-4 text-left shadow-sketch-soft transition disabled:cursor-not-allowed disabled:opacity-45",
                                  !isDisabled && "hover:-translate-y-0.5",
                                )}
                                style={{ "--btn-hover-rotate": "0.6deg" } as React.CSSProperties}
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <span
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink-800 shadow-sketch-soft"
                                    style={{ backgroundColor: setupDisplayCategory?.accent ?? setupCategory.accent }}
                                  >
                                    <Icon className="h-5 w-5" aria-hidden />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block font-hand text-xl font-bold leading-tight text-ink-900">
                                      {option.label}
                                    </span>
                                  </span>
                                </span>
                                <span className="shrink-0 rounded-full border border-ink-800 bg-paper-50 px-2.5 py-0.5 text-sm font-bold text-ink-800">
                                  {count} ใบ
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSetupStep("depth")}
                          className="btn-doodle inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
                          style={{ "--btn-hover-rotate": "-0.8deg" } as React.CSSProperties}
                        >
                          <ChevronLeft className="h-5 w-5" aria-hidden />
                          <span>กลับไปเลือกความลึก</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {transitionMode && (
        <ModeTransitionOverlay
          targetMode={transitionMode}
          onHalfway={() => setSelectedTalkMode(transitionMode)}
          onComplete={() => setTransitionMode(null)}
        />
      )}
    </main>
  );
}
