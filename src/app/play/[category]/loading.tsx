"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const loadingTips = [
  "กำลังปัดฝุ่นกล่องการ์ดคำถาม...",
  "เตรียมน้ำชาอุ่น ๆ สำหรับวงสนทนา...",
  "หยิบดินสอมาลงสีหน้าการ์ดแป๊บนึงนะ...",
  "จัดโต๊ะ เก้าอี้ และสร้างพื้นที่ปลอดภัย...",
  "เตรียมเปิดใจและถนอมความรู้สึกร่วมกัน...",
  "รอกระดาษและหมึกสเก็ตช์สักครู่เดียว..."
];

function getCategoryMeta(slug: string) {
  switch (slug) {
    case "icebreaker":
      return { name: "Icebreaker", accent: "#ccebd9" };
    case "love":
      return { name: "Love", accent: "#ffd5bd" };
    case "memory":
      return { name: "Memory", accent: "#f7e7a7" };
    case "family":
      return { name: "Family", accent: "#f3b8c6" };
    default:
      return { name: "ทั้งหมด", accent: "#ffd5bd" };
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
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

export default function PlayLoading() {
  const params = useParams();
  const categorySlug = (params?.category as string) || "all";
  const { name: categoryName, accent } = getCategoryMeta(categorySlug);

  const [tipIndex, setTipIndex] = useState(0);

  // Cycle tips every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % loadingTips.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const dynamicBackgroundStyle = {
    background: `
      radial-gradient(circle at top left, ${accent}4d, transparent 36rem),
      radial-gradient(circle at 85% 15%, ${accent}33, transparent 28rem),
      linear-gradient(90deg, rgba(47, 41, 37, 0.035) 1px, transparent 1px),
      linear-gradient(rgba(47, 41, 37, 0.035) 1px, transparent 1px),
      var(--paper)
    `,
    backgroundSize: "auto, auto, 32px 32px, 32px 32px, auto",
    "--category-glow": accent,
    "--category-glow-soft": `${accent}66`,
    "--category-glow-alpha": `${accent}26`,
    "--bg-glow-1": `${accent}24`,
    "--bg-glow-2": `${accent}18`,
  } as React.CSSProperties;

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-6 text-ink-900 sm:px-6 lg:px-8 transition-colors duration-500"
      style={dynamicBackgroundStyle}
    >
      <motion.div
        className="relative mx-auto max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Navigation Bar Skeleton */}
        <motion.nav
          variants={itemVariants}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="btn-doodle group inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-2.5 font-hand text-lg font-bold shadow-sketch-soft"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>กลับไปเลือกหมวดหมู่</span>
            </Link>
            <div className="h-12 w-12 rounded-note border-2 border-ink-800 bg-white dark:bg-[#1e1e22] shadow-sketch-soft" />
          </div>

          <div
            className="inline-flex rotate-[0.5deg] items-center gap-2 rounded-full border-2 border-ink-800 px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
            style={{ backgroundColor: accent }}
          >
            <Sparkles className="h-5 w-5 animate-pulse text-ink-900" />
            <span>หมวดหมู่: {categoryName}</span>
          </div>
        </motion.nav>

        {/* Playroom Title Skeleton */}
        <motion.header
          variants={itemVariants}
          className="mb-6 rounded-note border-2 border-dashed border-ink-800/40 bg-paper-50/60 p-5 animate-pulse"
        >
          <div className="h-8 w-1/3 skeleton-bar" />
          <div className="mt-3 h-4 w-2/3 skeleton-bar" />
        </motion.header>

        {/* Main Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
          {/* Left Card Zone */}
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="relative mx-auto w-full max-w-2xl min-h-[470px] sm:min-h-[520px]">
              {/* Stack Background Cards (Visual Decoration) */}
              <div className="absolute inset-0 border-2 border-ink-800 rounded-[31px_25px_34px_23px] bg-paper-50/70 shadow-sketch-soft pointer-events-none z-0 rotate-[1.5deg] translate-y-[2.5px] translate-x-[1.5px]" />
              <div className="absolute inset-0 border-2 border-ink-800 rounded-[31px_25px_34px_23px] bg-paper-50/40 shadow-sketch-soft pointer-events-none z-0 rotate-[-2deg] translate-y-[5px] translate-x-[-2px]" />

              {/* Main Loading Card */}
              <div
                className="absolute inset-0 w-full select-none sketchy-panel bg-paper-50 p-7 sm:p-9 flex flex-col justify-between items-center text-center z-10 animate-sketch-wobble"
                style={{
                  backgroundColor: "var(--panel-bg-override, rgba(255, 255, 255, 0.95))",
                }}
              >
                {/* Accent Color Band */}
                <div
                  className="absolute top-0 inset-x-0 h-3 rounded-tl-[22px] rounded-tr-[16px]"
                  style={{ backgroundColor: accent }}
                />

                {/* Top card detail */}
                <div className="w-full flex justify-between items-center z-10">
                  <div className="h-6 w-24 skeleton-bar animate-pulse" />
                  <div className="h-10 w-10 rounded-full border border-ink-800 bg-white dark:bg-[#1e1e22] animate-pulse" />
                </div>

                {/* Cute Animated Pencil SVG Character */}
                <div className="relative flex flex-col items-center justify-center my-4 z-10">
                  <div className="relative h-32 w-32 flex items-center justify-center">
                    {/* Pulsing Backlight */}
                    <div 
                      className="absolute inset-2 rounded-full blur-xl opacity-60 animate-pulse transition-colors duration-500" 
                      style={{ backgroundColor: accent }}
                    />
                    
                    {/* SVG Cute Pencil drawing a card outline */}
                    <svg
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="relative z-10 animate-pencil-wiggle"
                    >
                      {/* Paper Card Outline drawing line */}
                      <path
                        d="M15 80 C 15 25, 25 15, 80 15"
                        stroke="#2f2925"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="4 4"
                        className="dark:stroke-white/60"
                      />
                      
                      {/* Pencil Body */}
                      <g id="pencil">
                        {/* Eraser */}
                        <path d="M68 28 L78 38 C80 40, 84 40, 86 38 L90 34 C92 32, 92 28, 90 26 L80 16 C78 14, 74 14, 72 16 L68 20 C66 22, 66 26, 68 28 Z" fill="#f3b8c6" stroke="#2f2925" strokeWidth="2.5" />
                        <path d="M72 16 L82 26" stroke="#2f2925" strokeWidth="2.5" />
                        {/* Metal band */}
                        <rect x="64" y="24" width="12" height="6" transform="rotate(45 64 24)" fill="#f7e7a7" stroke="#2f2925" strokeWidth="2.5" />
                        {/* Wooden Shaft */}
                        <path d="M35 61 L65 31 L77 43 L47 73 Z" fill="#ffd5bd" stroke="#2f2925" strokeWidth="2.5" />
                        {/* Pencil Lead Cone */}
                        <path d="M35 61 L22 74 L47 73 Z" fill="#e5c690" stroke="#2f2925" strokeWidth="2.5" />
                        {/* Lead Tip */}
                        <path d="M26 70 L22 74 L30 73 Z" fill="#2f2925" stroke="#2f2925" strokeWidth="1" />
                        
                        {/* Smiley Face on Pencil */}
                        {/* Eye left */}
                        <circle cx="53" cy="45" r="2.5" fill="#2f2925" />
                        {/* Eye right */}
                        <circle cx="61" cy="37" r="2.5" fill="#2f2925" />
                        {/* Smile */}
                        <path d="M54 49 Q57 52 60 49" stroke="#2f2925" strokeWidth="2" strokeLinecap="round" />
                      </g>
                    </svg>
                  </div>

                  {/* Cycling Cute Loading Text */}
                  <p className="mt-4 font-hand text-xl font-bold text-ink-900 transition-all duration-300 transform scale-100 hover:scale-105">
                    {loadingTips[tipIndex]}
                  </p>
                </div>

                {/* Bottom card detail */}
                <div className="w-full flex justify-center z-10">
                  <div className="h-5 w-40 skeleton-bar animate-pulse" />
                </div>
              </div>
            </div>

            {/* Sub-Card Tip Skeleton */}
            <div className="h-6 w-3/4 mx-auto skeleton-bar animate-pulse" />

            {/* Action Buttons Skeleton */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="h-14 w-44 rounded-note border-2 border-ink-800 bg-white dark:bg-[#1e1e22] shadow-sketch-soft skeleton-bar animate-pulse" />
              <div className="h-14 w-40 rounded-note border-2 border-ink-800 bg-white dark:bg-[#1e1e22] shadow-sketch-soft skeleton-bar animate-pulse" />
            </div>
          </motion.section>

          {/* Right Sidebar Skeleton */}
          <aside className="space-y-5">
            {/* Multiplayer Skeleton */}
            <motion.div variants={itemVariants}>
              <div className="sketchy-panel bg-white/90 p-5 paper-tilt-left animate-pulse">
                <div className="h-6 w-4/5 skeleton-bar" />
                <div className="mt-2 h-4 w-full skeleton-bar" />
                <div className="mt-4 flex gap-2">
                  <div className="h-10 w-full rounded-note border-2 border-ink-800 bg-white dark:bg-[#1e1e22] skeleton-bar" />
                  <div className="h-10 w-16 rounded-note border-2 border-ink-800 bg-white dark:bg-[#1e1e22] skeleton-bar" />
                </div>
              </div>
            </motion.div>

            {/* Status Skeleton */}
            <motion.div variants={itemVariants}>
              <div className="sketchy-panel bg-white/90 p-5 paper-tilt-right animate-pulse">
                <div className="h-6 w-3/5 skeleton-bar" />
                <div className="mt-3 h-4 w-4/5 skeleton-bar" />
                <div className="mt-4">
                  <div className="h-3 w-1/4 skeleton-bar mb-2" />
                  <div className="w-full bg-paper-50 rounded-full border-2 border-ink-800 h-4 skeleton-bar" />
                </div>
              </div>
            </motion.div>

            {/* Mindful Tips Skeleton */}
            <motion.div variants={itemVariants}>
              <div className="sketchy-panel bg-white/90 p-5 paper-tilt-left animate-pulse">
                <div className="h-6 w-1/2 skeleton-bar" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full skeleton-bar" />
                  <div className="h-4 w-5/6 skeleton-bar" />
                </div>
              </div>
            </motion.div>
          </aside>
        </div>
      </motion.div>
    </main>
  );
}
