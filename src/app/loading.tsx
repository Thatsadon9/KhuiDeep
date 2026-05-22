import { Sparkles } from "lucide-react";

const tilts = [
  "rotate-[-1.5deg]",
  "rotate-[1deg]",
  "rotate-[-1deg]",
  "rotate-[2deg]",
  "rotate-[-2deg]",
  "rotate-[1.5deg]",
];

const skeletonAccents = [
  "#ffd5bd", // peach
  "#ccebd9", // mint
  "#f3b8c6", // rose
  "#f7e7a7", // lemon
  "#b9d9f2", // sky
  "#d9c9ef", // lilac
];

export default function HomeLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-ink-900 sm:px-6 lg:px-8">
      {/* Theme Switcher Button Placeholder */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6 lg:right-12 lg:top-8">
        <div className="h-12 w-12 rounded-note border-2 border-ink-800 bg-white dark:bg-[#1e1e22] shadow-sketch-soft" />
      </div>

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -left-24 top-44 h-48 w-48 rotate-12 rounded-[42%_58%_47%_53%] border-2 border-dashed border-ink-800/10 bg-doodle-sky/10 dark:bg-doodle-sky/5" />
      <div className="pointer-events-none absolute bottom-10 right-4 h-32 w-32 rotate-[-10deg] rounded-[55%_45%_50%_50%] border-2 border-dashed border-ink-800/10 bg-doodle-mint/15 dark:bg-doodle-mint/5" />

      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <div className="inline-flex rotate-[-1.5deg] items-center gap-2 rounded-full border-2 border-ink-800 bg-doodle-lemon px-4 py-1.5 font-hand text-base font-bold shadow-sketch-soft">
            <Sparkles className="h-5 w-5 animate-pulse text-ink-900" aria-hidden />
            <span>พื้นที่คุยแบบใจเย็น</span>
          </div>
          <h1 className="mt-6 font-hand text-6xl font-bold leading-tight tracking-normal text-ink-900 sm:text-7xl">
            KhuiDeep
            <span className="block text-4xl mt-1 text-ink-800/60 dark:text-ink-700 font-medium">คุยดีพ</span>
          </h1>
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="h-6 w-80 max-w-full skeleton-bar animate-pulse" />
            <div className="h-4 w-64 max-w-full skeleton-bar animate-pulse" />
          </div>
        </header>

        {/* Categories Grid Skeleton */}
        <section aria-label="กำลังโหลดหมวดหมู่" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => {
            const tiltClass = tilts[index % tilts.length];
            const accent = skeletonAccents[index % skeletonAccents.length];

            return (
              <div
                key={index}
                className={`group relative flex flex-col justify-between min-h-[260px] p-6 sketchy-panel ${tiltClass} animate-sketch-wobble`}
                style={{
                  backgroundColor: "var(--panel-bg-override, rgba(255, 255, 255, 0.95))",
                  animationDelay: `${index * 0.15}s`,
                  "--category-glow": accent,
                  "--category-glow-soft": `${accent}66`,
                  "--category-glow-alpha": `${accent}26`,
                } as React.CSSProperties}
              >
                {/* Accent Color Band */}
                <div
                  className="absolute top-0 inset-x-0 h-3 rounded-t-[22px_16px_0_0]"
                  style={{ backgroundColor: accent }}
                />

                {/* Card Top */}
                <div className="relative pt-3">
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon Box Skeleton */}
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-800 shadow-sketch-soft animate-pulse"
                      style={{ backgroundColor: accent }}
                    />

                    {/* Count Badge Skeleton */}
                    <div className="h-7 w-14 rounded-full border-2 border-ink-800 bg-white dark:bg-[#1e1e22] shadow-sketch-soft skeleton-bar animate-pulse" />
                  </div>

                  {/* Title Skeleton */}
                  <div className="mt-5 h-7 w-1/2 skeleton-bar animate-pulse" />
                  
                  {/* Description Skeleton */}
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-full skeleton-bar animate-pulse" />
                    <div className="h-4 w-5/6 skeleton-bar animate-pulse" />
                  </div>
                </div>

                {/* Card Bottom / CTA Skeleton */}
                <div className="mt-6 border-t border-dashed border-ink-800/20 pt-4 flex items-center justify-between">
                  <div className="h-6 w-28 skeleton-bar animate-pulse" />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                </div>
              </div>
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
