"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { clsx } from "clsx";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "late-night">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read theme from localStorage or document class
    const savedTheme = localStorage.getItem("theme") as "light" | "late-night" | null;
    const initialTheme = savedTheme || (document.documentElement.classList.contains("late-night") ? "late-night" : "light");
    
    setTheme(initialTheme);
    if (initialTheme === "late-night") {
      document.documentElement.classList.add("late-night");
    } else {
      document.documentElement.classList.remove("late-night");
    }
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "late-night" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "late-night") {
      document.documentElement.classList.add("late-night");
    } else {
      document.documentElement.classList.remove("late-night");
    }
  };

  if (!mounted) {
    // Return a skeleton or placeholder with the same dimensions to avoid Layout Shift
    return (
      <div className="h-12 w-12 rounded-note border-2 border-ink-800 bg-white opacity-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        "btn-doodle flex h-12 w-12 items-center justify-center rounded-note border-2 border-ink-800 shadow-sketch-soft focus:outline-none transition-all duration-300",
        theme === "late-night"
          ? "bg-[#1e1e22] text-[#fde047] hover:bg-[#2a2a30]"
          : "bg-white text-ink-800 hover:bg-paper-50"
      )}
      style={{
        "--btn-hover-rotate": theme === "late-night" ? "8deg" : "-8deg",
        "--btn-glow": theme === "late-night" ? "#fde047" : "transparent"
      } as React.CSSProperties}
      aria-label={theme === "late-night" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดกลางคืนสายดาร์ก"}
      title={theme === "late-night" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดกลางคืนสายดาร์ก"}
    >
      {theme === "late-night" ? (
        <Sun className="h-6 w-6 animate-spin-slow" />
      ) : (
        <Moon className="h-6 w-6" />
      )}
    </button>
  );
}
