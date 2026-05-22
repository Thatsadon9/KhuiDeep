"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { SoundEngine, type SoundPreferences, type BgmTrackId } from "@/lib/sound-engine";

type SoundContextValue = {
  prefs: SoundPreferences;
  playFlip: () => void;
  playDraw: () => void;
  playPop: () => void;
  playClick: () => void;
  playNotify: () => void;
  toggleBgm: () => void;
  toggleSfx: () => void;
  setBgmVolume: (v: number) => void;
  selectTrack: (id: BgmTrackId) => void;
  nextTrack: () => void;
  prevTrack: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<SoundEngine | null>(null);

  // Lazily create the singleton engine
  if (!engineRef.current) {
    engineRef.current = new SoundEngine();
  }
  const engine = engineRef.current;

  // Subscribe to engine state changes
  const prefs = useSyncExternalStore(
    useCallback((cb: () => void) => engine.subscribe(cb), [engine]),
    () => engine.prefs,
    () => engine.prefs
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const value = useMemo<SoundContextValue>(
    () => ({
      prefs,
      playFlip: () => engine.playFlip(),
      playDraw: () => engine.playDraw(),
      playPop: () => engine.playPop(),
      playClick: () => engine.playClick(),
      playNotify: () => engine.playNotify(),
      toggleBgm: () => engine.toggleBgm(),
      toggleSfx: () => engine.toggleSfx(),
      setBgmVolume: (v: number) => engine.setBgmVolume(v),
      selectTrack: (id: BgmTrackId) => engine.selectTrack(id),
      nextTrack: () => engine.nextTrack(),
      prevTrack: () => engine.prevTrack(),
    }),
    [prefs, engine]
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

export function useSoundEngine(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSoundEngine must be used within <SoundProvider>");
  }
  return ctx;
}
