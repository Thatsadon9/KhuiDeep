"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  Music,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  X,
  Sparkles,
} from "lucide-react";
import { useSoundEngine } from "@/components/sound-provider";
import { BGM_TRACKS } from "@/lib/sound-engine";

export function AmbientControl() {
  const {
    prefs,
    toggleBgm,
    toggleSfx,
    setBgmVolume,
    selectTrack,
    nextTrack,
    prevTrack,
    playClick,
  } = useSoundEngine();

  const [isOpen, setIsOpen] = useState(false);

  const currentTrack =
    BGM_TRACKS.find((t) => t.id === prefs.bgmTrackId) ?? BGM_TRACKS[0];

  return (
    <div className="ambient-control-wrapper" id="ambient-control">
      {/* Floating Toggle Button */}
      <motion.button
        type="button"
        onClick={() => {
          playClick();
          setIsOpen((prev) => !prev);
        }}
        className={clsx(
          "ambient-fab",
          isOpen && "ambient-fab--open",
          prefs.bgmEnabled && "ambient-fab--playing"
        )}
        whileHover={{ scale: 1.08, rotate: -3 }}
        whileTap={{ scale: 0.92 }}
        aria-label={isOpen ? "ปิดแผงควบคุมเสียง" : "เปิดแผงควบคุมเสียง"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Music className="h-5 w-5" />
        )}
        {prefs.bgmEnabled && !isOpen && (
          <span className="ambient-fab-pulse" aria-hidden />
        )}
      </motion.button>

      {/* Expanded Control Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ambient-panel"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            {/* Panel Header */}
            <div className="ambient-panel-header">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
                <span className="font-hand text-lg font-bold">
                  🎶 บรรยากาศ
                </span>
              </div>
            </div>

            {/* BGM Section */}
            <div className="ambient-section">
              <div className="ambient-section-label">
                <span>เพลงบรรเลง</span>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    toggleBgm();
                  }}
                  className={clsx(
                    "ambient-toggle",
                    prefs.bgmEnabled && "ambient-toggle--on"
                  )}
                  aria-label={
                    prefs.bgmEnabled ? "ปิดเพลงบรรเลง" : "เปิดเพลงบรรเลง"
                  }
                >
                  <span className="ambient-toggle-knob" />
                </button>
              </div>

              {/* Track Display & Controls */}
              <div className="ambient-track-display">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    prevTrack();
                  }}
                  className="ambient-track-btn"
                  aria-label="แทร็กก่อนหน้า"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>

                <div className="ambient-track-info">
                  <span className="ambient-track-emoji">
                    {currentTrack.emoji}
                  </span>
                  <span className="ambient-track-title">
                    {currentTrack.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    nextTrack();
                  }}
                  className="ambient-track-btn"
                  aria-label="แทร็กถัดไป"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={() => {
                  toggleBgm();
                }}
                className={clsx(
                  "ambient-play-btn",
                  prefs.bgmEnabled && "ambient-play-btn--playing"
                )}
                aria-label={prefs.bgmEnabled ? "หยุดเพลง" : "เล่นเพลง"}
              >
                {prefs.bgmEnabled ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>

              {/* Volume Slider */}
              <div className="ambient-volume">
                <VolumeX className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(prefs.bgmVolume * 100)}
                  onChange={(e) =>
                    setBgmVolume(parseInt(e.target.value, 10) / 100)
                  }
                  className="ambient-volume-slider"
                  aria-label="ระดับเสียงเพลง"
                />
                <Volume2 className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </div>

              {/* Track Quick Select */}
              <div className="ambient-track-list">
                {BGM_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      selectTrack(track.id);
                    }}
                    className={clsx(
                      "ambient-track-chip",
                      prefs.bgmTrackId === track.id &&
                        "ambient-track-chip--active"
                    )}
                    title={track.title}
                    aria-label={`เลือกเพลง ${track.title}`}
                    aria-pressed={prefs.bgmTrackId === track.id}
                  >
                    <span>{track.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SFX Section */}
            <div className="ambient-section">
              <div className="ambient-section-label">
                <span>เสียงเอฟเฟกต์</span>
                <button
                  type="button"
                  onClick={() => {
                    toggleSfx();
                  }}
                  className={clsx(
                    "ambient-toggle",
                    prefs.sfxEnabled && "ambient-toggle--on"
                  )}
                  aria-label={
                    prefs.sfxEnabled
                      ? "ปิดเสียงเอฟเฟกต์"
                      : "เปิดเสียงเอฟเฟกต์"
                  }
                >
                  <span className="ambient-toggle-knob" />
                </button>
              </div>
              <p className="ambient-hint">
                เสียงกระดาษพลิก, กระดิ่งลม, ดินสอขีด
              </p>
            </div>

            {/* Footer */}
            <div className="ambient-footer">
              <span>🎵 เพลง CC0 โดย open-lofi</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
