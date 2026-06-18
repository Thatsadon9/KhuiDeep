"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Rocket, Sparkles } from "lucide-react";
import type { TalkModeId } from "@/lib/talk-modes";

type ModeTransitionOverlayProps = {
  targetMode: TalkModeId;
  onHalfway: () => void;
  onComplete: () => void;
};

// Procedural synthesizer sound for entering space / interesting mode
const playWarpSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Synth Sound 1: Rising sweep
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(1300, now + 0.85);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.85);
    filter.Q.value = 8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.9);

    // Synth Sound 2: A retro chip sequence
    const notes = [600, 900, 1300, 1800];
    notes.forEach((freq, idx) => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq, now + 0.15 + idx * 0.1);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.04, now + 0.15 + idx * 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.1);

      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.15 + idx * 0.1);
      osc2.stop(now + 0.4 + idx * 0.1);
    });

    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    console.warn("Failed to play warp sound", e);
  }
};

// Procedural synthesizer sound for entering warm / deep mode
const playCozySound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, delay: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    };

    // Descending warm relaxing arpeggio
    playTone(523.25, 0.0, 0.9, 0.06); // C5
    playTone(392.00, 0.15, 0.9, 0.05); // G4
    playTone(329.63, 0.3, 0.9, 0.05); // E4
    playTone(261.63, 0.45, 1.2, 0.07); // C4
    playTone(174.61, 0.6, 1.4, 0.08); // F3

    setTimeout(() => ctx.close(), 2200);
  } catch (e) {
    console.warn("Failed to play cozy sound", e);
  }
};

export function ModeTransitionOverlay({
  targetMode,
  onHalfway,
  onComplete,
}: ModeTransitionOverlayProps) {
  const [phase, setPhase] = useState<"entering" | "exiting">("entering");

  useEffect(() => {
    // 1. Play synthesized SFX matching target mode
    if (targetMode === "interesting") {
      playWarpSound();
    } else {
      playCozySound();
    }

    // 2. Trigger halfway point to change background state
    const halfwayTimer = setTimeout(() => {
      onHalfway();
      setPhase("exiting");
    }, 800);

    // 3. Complete the transition
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1600);

    return () => {
      clearTimeout(halfwayTimer);
      clearTimeout(completeTimer);
    };
  }, [targetMode, onHalfway, onComplete]);

  const isWarp = targetMode === "interesting";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-auto">
      {/* Wipe Overlay Curtain */}
      <motion.div
        className={`absolute inset-0 ${
          isWarp
            ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-zinc-950"
            : "bg-[#fffdf7]"
        }`}
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={
          phase === "entering"
            ? { clipPath: "circle(150% at 50% 50%)" }
            : { clipPath: "circle(0% at 50% 50%)" }
        }
        transition={{ duration: 0.8, ease: [0.66, 0, 0.34, 1] }}
      >
        {/* Background Decorative patterns */}
        {isWarp ? (
          // Cyber Space Grid for Interesting Mode
          <div className="absolute inset-0 opacity-20 doodle-grid pointer-events-none">
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-indigo-950/70" />
          </div>
        ) : (
          // Soft Hand-Drawn Notebook grid for Deep Mode
          <div className="absolute inset-0 opacity-15 doodle-grid pointer-events-none" />
        )}

        {/* Warp Particles (Space Stars) */}
        {isWarp && phase === "entering" && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(24)].map((_, i) => {
              const angle = (i * 360) / 24 + Math.random() * 10;
              const delay = Math.random() * 0.3;
              const scale = 0.2 + Math.random() * 0.8;
              return (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-cyan-400"
                  style={{
                    boxShadow: "0 0 10px rgba(34,211,238,0.8)",
                  }}
                  initial={{ x: 0, y: 0, scale: 0.1, opacity: 0 }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * 800,
                    y: Math.sin((angle * Math.PI) / 180) * 800,
                    scale: scale * 2,
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                    delay: delay,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Floating Heart / Sparkle Particles for Deep Mode */}
        {!isWarp && phase === "entering" && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => {
              const xStart = 10 + Math.random() * 80; // percentage
              const delay = Math.random() * 0.4;
              const scale = 0.5 + Math.random() * 0.8;
              const duration = 1.0 + Math.random() * 0.5;

              return (
                <motion.div
                  key={i}
                  className="absolute text-doodle-mint"
                  style={{ left: `${xStart}%`, bottom: "-10%" }}
                  initial={{ y: 0, scale: 0.5, opacity: 0, rotate: 0 }}
                  animate={{
                    y: "-110vh",
                    scale: scale,
                    opacity: [0, 0.8, 0.8, 0],
                    rotate: Math.random() * 30 - 15,
                  }}
                  transition={{
                    duration: duration,
                    ease: "easeOut",
                    delay: delay,
                  }}
                >
                  {i % 2 === 0 ? (
                    <Heart className="h-8 w-8 fill-doodle-mint/20" />
                  ) : (
                    <Sparkles className="h-7 w-7 text-doodle-lemon" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Warp Spaceship Animation */}
        {isWarp && (
          <motion.div
            className="absolute z-10 text-pink-400"
            style={{
              filter: "drop-shadow(0 0 15px rgba(244,114,182,0.85))",
            }}
            initial={{ y: "100vh", x: "-10vw", rotate: 18 }}
            animate={
              phase === "entering"
                ? { y: "-120vh", x: "10vw", rotate: 18 }
                : { y: "-120vh", x: "10vw", rotate: 18 }
            }
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <Rocket className="h-24 w-24" />
          </motion.div>
        )}

        {/* Central Display Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-col items-center max-w-lg"
          >
            {isWarp ? (
              // Cyber Text layout
              <>
                <span className="font-mono text-xs md:text-sm tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                  [ System Warp Protocol Active ]
                </span>
                <h2 className="mt-5 font-hand text-4xl md:text-6xl font-bold text-pink-300 drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]">
                  กำลังวาร์ปไปโหมดคุยเปิดโลก!
                </h2>
                <div className="mt-6 flex gap-1.5 justify-center">
                  {[...Array(4)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-cyan-400"
                      style={{ boxShadow: "0 0 8px rgba(34,211,238,0.8)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              // Cozy Warm Text layout
              <>
                <span className="font-hand text-ink-500 text-lg md:text-xl italic">
                  พักสมองเบา ๆ คุยกันอบอุ่นใจ
                </span>
                <h2 className="mt-3 font-hand text-4xl md:text-6xl font-bold text-ink-800">
                  กำลังกลับสู่โหมดอบอุ่นใจ...
                </h2>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="mt-6 text-doodle-mint"
                >
                  <Heart className="h-10 w-10 fill-current" />
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
