/**
 * SoundEngine — Web Audio API synthesizer for KhuiDeep
 *
 * SFX are generated procedurally (no files needed).
 * BGM plays local tracks from /audio/.
 */

export const BGM_TRACKS = [
  {
    id: "track-1",
    title: "เพลงชิลล์ๆ (โหมดคาเฟ่)",
    url: "/audio/track1.mp3",
    emoji: "☕",
  }
] as const;

export type BgmTrackId = (typeof BGM_TRACKS)[number]["id"];

export type SoundPreferences = {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number; // 0..1
  bgmTrackId: BgmTrackId;
};

const DEFAULT_PREFS: SoundPreferences = {
  sfxEnabled: true,
  bgmEnabled: false,
  bgmVolume: 0.35,
  bgmTrackId: BGM_TRACKS[0].id,
};

const STORAGE_KEY = "khui-deep-sound-prefs";

function loadPrefs(): SoundPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

function savePrefs(prefs: SoundPreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private _prefs: SoundPreferences;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this._prefs = loadPrefs();
  }

  get prefs(): SoundPreferences {
    return this._prefs;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private updatePrefs(partial: Partial<SoundPreferences>) {
    this._prefs = { ...this._prefs, ...partial };
    savePrefs(this._prefs);
    this.notify();
  }

  // --- AudioContext lazy init ---
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- Helper: create noise buffer ---
  private createNoiseBuffer(duration: number, sampleRate: number): AudioBuffer {
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ensureCtx().createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    // Brown noise gives a softer paper/friction texture than harsh white noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate for volume
    }
    return buffer;
  }

  // ========== SFX ==========

  /**
   * Card flip — crisp thick paper snap / tactile flip
   */
  playFlip() {
    if (!this._prefs.sfxEnabled) return;
    
    // Haptic Feedback (สั่นเบา ๆ 10ms)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    const ctx = this.ensureCtx();
    const now = ctx.currentTime;

    // 1. Cute UI "Pop" / "Tick" (Tonal component for playfulness)
    const pop = ctx.createOscillator();
    pop.type = "sine";
    pop.frequency.setValueAtTime(800, now);
    pop.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.15, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    pop.connect(popGain).connect(ctx.destination);
    pop.start(now);
    pop.stop(now + 0.06);

    // 2. Soft Paper Rustle (Friction component)
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.1, ctx.sampleRate);

    // Bandpass for a softer paper sound, removing harsh highs
    const paperFilter = ctx.createBiquadFilter();
    paperFilter.type = "bandpass";
    paperFilter.frequency.setValueAtTime(1800, now);
    paperFilter.frequency.linearRampToValueAtTime(900, now + 0.08);
    paperFilter.Q.value = 1.2;
    
    const paperGain = ctx.createGain();
    paperGain.gain.setValueAtTime(0, now);
    paperGain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    paperGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noise.connect(paperFilter).connect(paperGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  /**
   * Card draw / swipe — swooping paper slide (Swish)
   */
  playDraw() {
    if (!this._prefs.sfxEnabled) return;

    // Haptic Feedback (สั่นเบา-กลาง ตอนลากไพ่)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 30, 20]);
    }

    const ctx = this.ensureCtx();
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.2, ctx.sampleRate);

    // Creates the sweeping "Swish" motion sound
    const sweepFilter = ctx.createBiquadFilter();
    sweepFilter.type = "bandpass";
    sweepFilter.frequency.setValueAtTime(2500, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    sweepFilter.Q.value = 1.2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(sweepFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.2);
  }

  /**
   * New card bounce pop — single soft card landing
   */
  playPop() {
    if (!this._prefs.sfxEnabled) return;

    // Haptic Feedback (สั่นนุ่มๆ ตอนไพ่เด้งเข้ารูป)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }

    const ctx = this.ensureCtx();
    const now = ctx.currentTime;

    // Soft card body thud
    const thud = ctx.createOscillator();
    thud.type = "triangle";
    thud.frequency.setValueAtTime(150, now);
    thud.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.4, now);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    thud.connect(thudGain).connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.1);

    // Friction landing texture
    const friction = ctx.createBufferSource();
    friction.buffer = this.createNoiseBuffer(0.1, ctx.sampleRate);

    const frictionHp = ctx.createBiquadFilter();
    frictionHp.type = "highpass";
    frictionHp.frequency.value = 1200;

    const frictionGain = ctx.createGain();
    frictionGain.gain.setValueAtTime(0.15, now);
    frictionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    friction.connect(frictionHp).connect(frictionGain).connect(ctx.destination);
    friction.start(now);
    friction.stop(now + 0.1);
  }

  /** Button click — subtle tap */
  playClick() {
    if (!this._prefs.sfxEnabled) return;
    const ctx = this.ensureCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /** Notification — soft bell ding */
  playNotify() {
    if (!this._prefs.sfxEnabled) return;
    const ctx = this.ensureCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3); // C5

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  // ========== BGM ==========

  private ensureBgmAudio(): HTMLAudioElement {
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio();
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this._prefs.bgmVolume;
      this.bgmAudio.preload = "none";

      this.bgmAudio.addEventListener("error", () => {
        console.warn("[KhuiDeep BGM] ❌ ไม่สามารถโหลดไฟล์เพลงมาเล่นได้");
        this.updatePrefs({ bgmEnabled: false });
      });
    }
    return this.bgmAudio;
  }

  async playBgm() {
    const track = BGM_TRACKS.find((t) => t.id === this._prefs.bgmTrackId) ?? BGM_TRACKS[0];
    const audio = this.ensureBgmAudio();

    const url = track.url;
    
    const currentSrc = audio.src;
    if (!currentSrc.endsWith(url)) {
      audio.src = url;
      audio.load();
    }
    audio.volume = this._prefs.bgmVolume;

    try {
      await audio.play();
      this.updatePrefs({ bgmEnabled: true });
    } catch (_err) {
      console.warn(`[KhuiDeep BGM] ❌ เล่นเพลงไม่ได้ (ไม่พบไฟล์ ${url})`);
      console.warn("👉 วิธีแก้: ให้สร้างโฟลเดอร์ public/audio/ และโหลดไฟล์เสียงมาใส่ ตั้งชื่อเป็น track1.mp3");
      this.updatePrefs({ bgmEnabled: false });
    }
  }

  pauseBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
    this.updatePrefs({ bgmEnabled: false });
  }

  toggleBgm() {
    if (this._prefs.bgmEnabled) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
  }

  setBgmVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.bgmAudio) {
      this.bgmAudio.volume = clamped;
    }
    this.updatePrefs({ bgmVolume: clamped });
  }

  selectTrack(id: BgmTrackId) {
    if (this._prefs.bgmTrackId === id) return;
    this.updatePrefs({ bgmTrackId: id });
    if (this._prefs.bgmEnabled) {
      this.playBgm();
    }
  }

  nextTrack() {
    const currentIndex = BGM_TRACKS.findIndex((t) => t.id === this._prefs.bgmTrackId);
    const nextIndex = (currentIndex + 1) % BGM_TRACKS.length;
    this.selectTrack(BGM_TRACKS[nextIndex].id);
  }

  prevTrack() {
    const currentIndex = BGM_TRACKS.findIndex((t) => t.id === this._prefs.bgmTrackId);
    const prevIndex = (currentIndex - 1 + BGM_TRACKS.length) % BGM_TRACKS.length;
    this.selectTrack(BGM_TRACKS[prevIndex].id);
  }

  // ========== SFX Toggle ==========

  setSfxEnabled(enabled: boolean) {
    this.updatePrefs({ sfxEnabled: enabled });
  }

  toggleSfx() {
    this.setSfxEnabled(!this._prefs.sfxEnabled);
  }

  // ========== Cleanup ==========

  destroy() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.src = "";
      this.bgmAudio = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.listeners.clear();
  }
}
