"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { motion, useMotionValue, useTransform, useSpring, animate, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpenText,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Sparkles,
  Lightbulb,
  Users,
} from "lucide-react";
import { FlippingCard } from "@/components/flipping-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AmbientControl } from "@/components/ambient-control";
import { useSoundEngine } from "@/components/sound-provider";
import { getSupabaseClient } from "@/lib/supabase";
import type { DeepQuestion, QuestionCategory, QuestionDeck } from "@/types";

type KhuiDeepPlayProps = {
  deck: QuestionDeck;
  categorySlug: string;
};

const allCategory: QuestionCategory = {
  id: "all",
  slug: "all",
  name: "ทั้งหมด",
  description: "รวมคำถามจากทุกหมวดหมู่ไว้ในกองเดียวสำหรับทุกความสัมพันธ์",
  accent: "#ffd5bd",
  sortOrder: 0,
};

function pickRandomQuestion(pool: DeepQuestion[], currentId?: string) {
  if (pool.length === 0) {
    return null;
  }

  const candidates =
    pool.length > 1 && currentId
      ? pool.filter((question) => question.id !== currentId)
      : pool;

  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

function getNextPlayer(playersList: string[], lastPlayerName?: string | null) {
  if (playersList.length === 0) {
    return null;
  }
  if (!lastPlayerName) {
    return playersList[0];
  }
  const lastIndex = playersList.indexOf(lastPlayerName);
  if (lastIndex === -1) {
    return playersList[0];
  }
  return playersList[(lastIndex + 1) % playersList.length];
}

const validAudienceFilters = ["self", "friends", "talking_stage", "couple", "family"] as const;

const depthLabels: Record<number, string> = {
  1: "เบา ๆ",
  2: "กำลังดี",
  3: "ลึกขึ้น",
  4: "ลึกมาก",
  5: "ลึกสุดใจ",
};

const audienceLabels: Record<(typeof validAudienceFilters)[number], string> = {
  self: "เล่นคนเดียว",
  friends: "เพื่อน",
  talking_stage: "คนคุย / กำลังจีบ",
  couple: "แฟน / คู่รัก",
  family: "ครอบครัว",
};

function parseDepthFilter(value: string | null) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const roundedValue = Math.round(numericValue);
  if (roundedValue < 1 || roundedValue > 5) {
    return null;
  }

  return roundedValue;
}


export function KhuiDeepPlay({ deck, categorySlug }: KhuiDeepPlayProps) {
  const { playDraw, playFlip, playClick } = useSoundEngine();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomId = searchParams ? searchParams.get("room") : null;

  const selectedDepth = useMemo(
    () => parseDepthFilter(searchParams ? searchParams.get("depth") : null),
    [searchParams],
  );

  const selectedAudience = useMemo(() => {
    const value = searchParams ? searchParams.get("audience") : null;
    return validAudienceFilters.includes(value as (typeof validAudienceFilters)[number])
      ? (value as (typeof validAudienceFilters)[number])
      : null;
  }, [searchParams]);

  // Find current category
  const currentCategory = useMemo(() => {
    if (categorySlug === "all") {
      return allCategory;
    }
    return deck.categories.find((cat) => cat.slug === categorySlug) ?? allCategory;
  }, [deck.categories, categorySlug]);

  const baseQuestionPool = useMemo(() => {
    if (categorySlug === "all") {
      return deck.questions;
    }
    return deck.questions.filter((question) => question.categorySlug === categorySlug);
  }, [deck.questions, categorySlug]);

  // Filter questions for the selected category and setup choices from the landing modal.
  const questionPool = useMemo(() => {
    return baseQuestionPool.filter((question) => {
      const matchesDepth = selectedDepth ? question.level <= selectedDepth : true;
      const matchesAudience = selectedAudience ? question.audience.includes(selectedAudience) : true;

      return matchesDepth && matchesAudience;
    });
  }, [baseQuestionPool, selectedAudience, selectedDepth]);

  const selectedDepthLabel = selectedDepth ? depthLabels[selectedDepth] ?? `ระดับ ${selectedDepth}` : null;
  const selectedAudienceLabel = selectedAudience ? audienceLabels[selectedAudience] : null;

  type CardItem = {
    id: string;
    question: DeepQuestion | null;
    state: "active" | "exiting" | "entering";
    isFlipped: boolean;
    assignedPlayer: string | null;
  };

  const [visibleCards, setVisibleCards] = useState<CardItem[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set());
  const [roundNotice, setRoundNotice] = useState("");

  const [swipeState, setSwipeState] = useState<"idle" | "swiping-away">("idle");
  const x = useMotionValue(0);
  const cardRotate = useTransform(x, [-200, 200], [-8, 8]);
  
  // Create progress 0..1 based on distance dragged (max 150px)
  const dragProgressRaw = useTransform(x, [-150, 0, 150], [1, 0, 1]);
  const dragProgress = useSpring(dragProgressRaw, { stiffness: 300, damping: 25 });

  const activeCard = visibleCards.find((c) => c.state === "active");
  const isFlipped = activeCard?.isFlipped;

  // Reset card X offset smoothly when flipped state changes or new card becomes active
  useEffect(() => {
    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
  }, [isFlipped, activeCard?.id, x]);


  // Multiplayer States
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isPlayersLoaded, setIsPlayersLoaded] = useState(false);

  // Online Multiplayer States
  const [myNickname, setMyNickname] = useState<string>("");
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Refs to avoid infinite loops / unsubscribes in Realtime useEffect
  const usedIdsRef = useRef(usedIds);
  const visibleCardsRef = useRef(visibleCards);
  const roundNoticeRef = useRef(roundNotice);
  const playersRef = useRef(players);
  const myNicknameRef = useRef(myNickname);
  const questionPoolRef = useRef(questionPool);

  useEffect(() => {
    usedIdsRef.current = usedIds;
  }, [usedIds]);

  useEffect(() => {
    visibleCardsRef.current = visibleCards;
  }, [visibleCards]);

  useEffect(() => {
    roundNoticeRef.current = roundNotice;
  }, [roundNotice]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    myNicknameRef.current = myNickname;
  }, [myNickname]);

  useEffect(() => {
    questionPoolRef.current = questionPool;
  }, [questionPool]);

  // Load players on mount
  useEffect(() => {
    const stored = localStorage.getItem("khui-deep-players");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPlayers(parsed);
        }
      } catch (e) {
        console.error("Failed to parse players from localStorage", e);
      }
    }
    setIsPlayersLoaded(true);
  }, []);

  // Save players to localStorage (only in offline mode)
  useEffect(() => {
    if (isPlayersLoaded && !roomId) {
      localStorage.setItem("khui-deep-players", JSON.stringify(players));
    }
  }, [players, isPlayersLoaded, roomId]);

  // Prompt nickname if room is present in URL
  useEffect(() => {
    if (roomId) {
      const savedNickname = localStorage.getItem("khui-deep-my-nickname");
      if (savedNickname) {
        setMyNickname(savedNickname);
      } else {
        setShowNamePrompt(true);
      }
    } else {
      setShowNamePrompt(false);
    }
  }, [roomId]);

  const addPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (players.includes(name)) {
      alert("มีชื่อผู้เล่นนี้อยู่ในวงแล้วนะ!");
      return;
    }
    setPlayers((prev) => [...prev, name]);
    setNewPlayerName("");
  }, [newPlayerName, players]);

  const removePlayer = useCallback((nameToRemove: string) => {
    setPlayers((prev) => prev.filter((name) => name !== nameToRemove));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
  }, [addPlayer]);

  const createRoom = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("room", randomId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const exitRoom = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.delete("room");

    const stored = localStorage.getItem("khui-deep-players");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPlayers(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setPlayers([]);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const copyInviteLink = () => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (roomId) {
      params.set("room", roomId);
    }
    const query = params.toString();
    const inviteUrl = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleJoinRoomWithName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem("khui-deep-my-nickname", trimmed);
    setMyNickname(trimmed);
    setShowNamePrompt(false);
  };

  // Sync assignedPlayer to current active card when players load/change
  useEffect(() => {
    if (players.length > 0) {
      setVisibleCards((prev) =>
        prev.map((c) =>
          c.state === "active" && (!c.assignedPlayer || !players.includes(c.assignedPlayer))
            ? { ...c, assignedPlayer: players[0] }
            : c
        )
      );
    } else {
      setVisibleCards((prev) =>
        prev.map((c) =>
          c.state === "active" && c.assignedPlayer
            ? { ...c, assignedPlayer: null }
            : c
        )
      );
    }
  }, [players]);

  // Initialize first question on load / change of pool
  useEffect(() => {
    if (questionPool.length > 0) {
      const initial = questionPool[Math.floor(Math.random() * questionPool.length)];
      setVisibleCards([
        {
          id: `${initial.id}-${Date.now()}`,
          question: initial,
          state: "active",
          isFlipped: false,
          assignedPlayer: getNextPlayer(players, null),
        },
      ]);
      setUsedIds(new Set([initial.id]));
    } else {
      setVisibleCards([]);
      setUsedIds(new Set());
    }
    setRoundNotice("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionPool]);

  const remainingCount = Math.max(questionPool.length - usedIds.size, 0);

  const performCardTransition = useCallback((
    nextQuestion: DeepQuestion,
    nextAssignedPlayer: string | null,
    customUsedIds: Set<string>,
    notice: string
  ) => {
    setUsedIds(customUsedIds);
    setRoundNotice(notice);
    setSwipeState("swiping-away");

    setVisibleCards((prev) => {
      const updated = prev.map((c) =>
        c.state === "active" ? { ...c, state: "exiting" as const } : c
      );
      return [
        ...updated,
        {
          id: `${nextQuestion.id}-${Date.now()}`,
          question: nextQuestion,
          state: "entering" as const,
          isFlipped: false,
          assignedPlayer: nextAssignedPlayer,
        },
      ];
    });

    playDraw();
    animate(x, -200, { duration: 0.4, ease: "easeOut" });

    setTimeout(() => {
      setVisibleCards((prev) => {
        const entering = prev.find((c) => c.state === "entering");
        if (entering) {
          return [{ ...entering, state: "active" as const }];
        }
        return prev.filter((c) => c.state === "active");
      });
      setSwipeState("idle");
      x.set(0);
    }, 600);
  }, [x, playDraw]);

  const drawQuestion = useCallback(() => {
    if (questionPool.length === 0 || swipeState !== "idle") {
      return;
    }

    let availableQuestions = questionPool.filter((question) => !usedIds.has(question.id));
    let nextUsedIds = new Set(usedIds);
    let notice = "";

    if (availableQuestions.length === 0) {
      availableQuestions = questionPool;
      nextUsedIds = new Set();
      notice = "ครบทุกใบแล้ว เริ่มรอบใหม่ให้แล้วนะ";
    }

    const activeCard = visibleCards.find((c) => c.state === "active");
    const nextQuestion = pickRandomQuestion(availableQuestions, activeCard?.question?.id);

    if (!nextQuestion) {
      return;
    }

    nextUsedIds.add(nextQuestion.id);
    const nextAssignedPlayer = getNextPlayer(players, activeCard?.assignedPlayer);

    if (roomId && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "draw-card",
        payload: {
          questionId: nextQuestion.id,
          assignedPlayer: nextAssignedPlayer,
          notice,
          usedIds: Array.from(nextUsedIds),
        },
      });
    }

    performCardTransition(nextQuestion, nextAssignedPlayer, nextUsedIds, notice);
  }, [questionPool, usedIds, visibleCards, swipeState, players, roomId, performCardTransition]);

  const resetRound = useCallback(() => {
    if (questionPool.length === 0 || swipeState !== "idle") return;
    const nextQuestion = questionPool[Math.floor(Math.random() * questionPool.length)];
    if (!nextQuestion) return;

    const activeCard = visibleCards.find((c) => c.state === "active");
    const nextUsedIds = new Set([nextQuestion.id]);
    const nextAssignedPlayer = getNextPlayer(players, activeCard?.assignedPlayer);
    const notice = "เริ่มนับกองคำถามรอบนี้ใหม่แล้ว";

    if (roomId && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "reset-deck",
        payload: {
          questionId: nextQuestion.id,
          assignedPlayer: nextAssignedPlayer,
          usedIds: Array.from(nextUsedIds),
        },
      });
    }

    performCardTransition(nextQuestion, nextAssignedPlayer, nextUsedIds, notice);
  }, [questionPool, swipeState, players, visibleCards, roomId, performCardTransition]);

  const animateNextCard = useCallback(() => {
    drawQuestion();
  }, [drawQuestion]);

  const animateResetCard = useCallback(() => {
    resetRound();
  }, [resetRound]);

  // Connect to Supabase Realtime channel
  useEffect(() => {
    if (!roomId || !myNickname) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client is not available.");
      return;
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: myNickname,
        },
      },
    });

    channelRef.current = channel;

    // Handle Presence state synchronization
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const onlineNames = Object.keys(state);
      setPlayers(onlineNames);
    });

    // Handle Broadcast events
    channel.on("broadcast", { event: "draw-card" }, ({ payload }) => {
      const { questionId, assignedPlayer, notice, usedIds: sentUsedIds } = payload;
      const question = questionPoolRef.current.find((q) => q.id === questionId);
      if (question) {
        performCardTransition(question, assignedPlayer, new Set(sentUsedIds), notice);
      }
    });

    channel.on("broadcast", { event: "flip-card" }, ({ payload }) => {
      const { isFlipped: newFlippedState } = payload;
      setVisibleCards((prev) =>
        prev.map((c) => (c.state === "active" ? { ...c, isFlipped: newFlippedState } : c))
      );
    });

    channel.on("broadcast", { event: "reset-deck" }, ({ payload }) => {
      const { questionId, assignedPlayer, usedIds: sentUsedIds } = payload;
      const question = questionPoolRef.current.find((q) => q.id === questionId);
      if (question) {
        performCardTransition(question, assignedPlayer, new Set(sentUsedIds), "เริ่มนับกองคำถามรอบนี้ใหม่แล้ว");
      }
    });

    // Syncing state on join
    channel.on("broadcast", { event: "request-sync" }, () => {
      const currentState = channel.presenceState();
      const currentOnlineNames = Object.keys(currentState).sort();
      if (currentOnlineNames[0] === myNicknameRef.current) {
        const activeCard = visibleCardsRef.current.find((c) => c.state === "active");
        channel.send({
          type: "broadcast",
          event: "response-sync",
          payload: {
            usedIds: Array.from(usedIdsRef.current),
            activeCard: activeCard
              ? {
                  questionId: activeCard.question?.id,
                  isFlipped: activeCard.isFlipped,
                  assignedPlayer: activeCard.assignedPlayer,
                }
              : null,
            roundNotice: roundNoticeRef.current,
          },
        });
      }
    });

    channel.on("broadcast", { event: "response-sync" }, ({ payload }) => {
      const { usedIds: sentUsedIds, activeCard, roundNotice: sentNotice } = payload;
      setUsedIds(new Set(sentUsedIds));
      setRoundNotice(sentNotice);
      if (activeCard && activeCard.questionId) {
        const question = questionPoolRef.current.find((q) => q.id === activeCard.questionId);
        if (question) {
          setVisibleCards([
            {
              id: `${question.id}-${Date.now()}`,
              question,
              state: "active",
              isFlipped: activeCard.isFlipped,
              assignedPlayer: activeCard.assignedPlayer,
            },
          ]);
        }
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track({ online_at: new Date().toISOString() });
        // Ask for sync from any existing players
        channel.send({
          type: "broadcast",
          event: "request-sync",
          payload: {},
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, myNickname, performCardTransition]);

  // Framer motion transformed styles for background cards
  const bgCard1Style = {
    y: useTransform(dragProgress, [0, 1], [2.5, 0]),
    x: useTransform(dragProgress, [0, 1], [1.5, 0]),
    rotate: useTransform(dragProgress, [0, 1], [1.5, 0]),
    scale: useTransform(dragProgress, [0, 1], [0.985, 1]),
  };

  const bgCard2Style = {
    y: useTransform(dragProgress, [0, 1], [5, 2.5]),
    x: useTransform(dragProgress, [0, 1], [-2, 1.5]),
    rotate: useTransform(dragProgress, [0, 1], [-2, 1.5]),
    scale: useTransform(dragProgress, [0, 1], [0.97, 0.985]),
  };


  // Accent gradient based on the selected category's accent color
  const dynamicBackgroundStyle = useMemo(() => {
    return {
      background: `
        radial-gradient(circle at top left, ${currentCategory.accent}4d, transparent 36rem),
        radial-gradient(circle at 85% 15%, ${currentCategory.accent}33, transparent 28rem),
        linear-gradient(90deg, rgba(47, 41, 37, 0.035) 1px, transparent 1px),
        linear-gradient(rgba(47, 41, 37, 0.035) 1px, transparent 1px),
        var(--paper)
      `,
      backgroundSize: "auto, auto, 32px 32px, 32px 32px, auto",
      "--category-glow": currentCategory.accent,
      "--category-glow-soft": `${currentCategory.accent}66`,
      "--category-glow-alpha": `${currentCategory.accent}26`,
      "--bg-glow-1": `${currentCategory.accent}24`,
      "--bg-glow-2": `${currentCategory.accent}18`,
      "--btn-glow": currentCategory.accent,
    } as React.CSSProperties;
  }, [currentCategory.accent]);

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-6 text-ink-900 sm:px-6 lg:px-8 transition-colors duration-500"
      style={dynamicBackgroundStyle}
    >
      {/* Decorative background illustrations */}
      <Image
        src="/sketch-notes.svg"
        alt=""
        width={360}
        height={260}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 hidden w-56 rotate-2 opacity-80 sm:block lg:right-12 lg:top-8"
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Navigation Bar */}
        <nav className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="btn-doodle group inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-2.5 font-hand text-lg font-bold shadow-sketch-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon"
              style={{ "--btn-hover-rotate": "-0.6deg" } as React.CSSProperties}
            >
              <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
              <span>กลับไปเลือกหมวดหมู่</span>
            </Link>
            <ThemeToggle />
          </div>

          <div
            className="inline-flex rotate-[0.5deg] items-center gap-2 rounded-full border-2 border-ink-800 px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
            style={{ backgroundColor: currentCategory.accent }}
          >
            <Sparkles className="h-5 w-5 animate-pulse text-ink-900" />
            <span>หมวดหมู่: {currentCategory.name}</span>
          </div>
        </nav>

        {/* Playroom Title & Summary */}
        <header className="mb-6 rounded-note border-2 border-dashed border-ink-800/40 bg-paper-50/60 p-5">
          <h1 className="font-hand text-3xl font-bold text-ink-900 sm:text-4xl">
            กำลังสุ่มการ์ด: {currentCategory.name}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            {currentCategory.description}
          </p>
          {(selectedDepthLabel || selectedAudienceLabel) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedDepthLabel && (
                <span className="rounded-full border-2 border-ink-800 bg-white px-3 py-1 font-hand text-sm font-bold shadow-sketch-soft">
                  ความลึก: {selectedDepthLabel}
                </span>
              )}
              {selectedAudienceLabel && (
                <span className="rounded-full border-2 border-ink-800 bg-doodle-mint px-3 py-1 font-hand text-sm font-bold shadow-sketch-soft">
                  เล่นกับ: {selectedAudienceLabel}
                </span>
              )}
            </div>
          )}
        </header>

        {/* Card Arena & Info Sidebar Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
          {/* Card Play Zone */}
          <section className="space-y-6">
            <div className="relative mx-auto w-full max-w-2xl min-h-[470px] sm:min-h-[520px]">
              {/* Stack Background Cards (Visual Decoration) */}
              <motion.div 
                style={bgCard1Style} 
                className="absolute inset-0 border-2 border-ink-800 rounded-[31px_25px_34px_23px] bg-paper-50/70 shadow-sketch-soft pointer-events-none z-0" 
              />
              <motion.div 
                style={bgCard2Style} 
                className="absolute inset-0 border-2 border-ink-800 rounded-[31px_25px_34px_23px] bg-paper-50/40 shadow-sketch-soft pointer-events-none z-0" 
              />

              {questionPool.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[31px_25px_34px_23px] border-2 border-dashed border-ink-800 bg-paper-50/90 p-7 text-center shadow-sketch-soft">
                  <div className="max-w-md">
                    <Sparkles className="mx-auto h-9 w-9 text-ink-800" aria-hidden />
                    <h2 className="mt-4 font-hand text-3xl font-bold text-ink-900">
                      ยังไม่มีคำถามที่ตรงกับตัวเลือกนี้
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-ink-700">
                      ลองกลับไปเลือกความลึกหรือคนเล่นใหม่ หรือเพิ่ม audience ให้คำถามในหน้า admin
                    </p>
                    <Link
                      href="/"
                      className="btn-doodle mt-5 inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-lemon px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
                      style={{ "--btn-hover-rotate": "-0.8deg" } as React.CSSProperties}
                    >
                      <ArrowLeft className="h-5 w-5" aria-hidden />
                      <span>กลับไปเลือกใหม่</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Render Visible Cards */}
              {visibleCards.map((card) => {
                const isActive = card.state === "active";
                const isExiting = card.state === "exiting";
                const isEntering = card.state === "entering";

                return (
                  <motion.div
                    key={card.id}
                    className={clsx(
                      "tape absolute inset-0 w-full select-none touch-pan-y z-10",
                      isExiting && "card-exit"
                    )}
                    drag="x"
                    dragListener={isActive}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -100) {
                        drawQuestion();
                      }
                    }}
                    initial={isEntering ? { x: 400, rotate: 10, scale: 0.95, opacity: 0 } : false}
                    animate={isEntering ? { x: 0, rotate: 0, scale: 1, opacity: 1 } : undefined}
                    transition={isEntering ? { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } : undefined}
                    style={
                      isActive
                        ? { x, rotate: cardRotate, cursor: "grab", touchAction: "pan-y" }
                        : isExiting
                        ? ({ "--exit-start-x": `${x.get()}px`, "--exit-start-rotate": `${x.get() * 0.04}deg`, zIndex: 10, touchAction: "none" } as React.CSSProperties)
                        : { zIndex: 20, touchAction: "none" }
                    }
                  >
                    <FlippingCard
                      question={card.question}
                      category={currentCategory}
                      isFlipped={card.isFlipped}
                      assignedPlayer={card.assignedPlayer}
                      onToggle={() => {
                        if (isActive) {
                          playFlip();
                          const newFlippedState = !card.isFlipped;
                          if (roomId && channelRef.current) {
                            channelRef.current.send({
                              type: "broadcast",
                              event: "flip-card",
                              payload: {
                                isFlipped: newFlippedState,
                              },
                            });
                          }
                          setVisibleCards((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, isFlipped: newFlippedState } : c
                            )
                          );
                        }
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>

            {questionPool.length > 0 && (
              <p className="text-center font-hand text-base text-ink-600 animate-pulse mt-2 flex items-center justify-center gap-1.5">
                <Lightbulb className="h-5 w-5 text-ink-600 shrink-0" aria-hidden />
                <span>ปัดการ์ดไปทางซ้ายเพื่อเปลี่ยนใบใหม่ได้นะ!</span>
              </p>
            )}

            {/* Main Action Controllers */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => { playClick(); animateNextCard(); }}
                disabled={questionPool.length === 0 || swipeState !== "idle"}
                className={clsx(
                  "btn-doodle group inline-flex items-center gap-2 rounded-note border-2 border-ink-800 px-6 py-3.5 font-hand text-xl font-bold shadow-sketch-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon",
                  (questionPool.length === 0 || swipeState !== "idle")
                    ? "bg-ink-200/50 cursor-not-allowed opacity-50"
                    : "hover:bg-doodle-peach/90",
                )}
                style={{
                  "--btn-hover-rotate": "-0.6deg",
                  backgroundColor: (questionPool.length > 0 && swipeState === "idle") ? currentCategory.accent : undefined,
                } as React.CSSProperties}
              >
                <Shuffle className="h-5 w-5 transition-transform duration-500 ease-out group-hover:rotate-180" aria-hidden />
                <span>สุ่มคำถามถัดไป</span>
              </button>
              <button
                type="button"
                onClick={() => { playClick(); animateResetCard(); }}
                disabled={questionPool.length === 0 || swipeState !== "idle"}
                className="btn-doodle group inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-5 py-3.5 font-hand text-lg font-bold shadow-sketch-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-doodle-lemon disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ "--btn-hover-rotate": "0.6deg" } as React.CSSProperties}
              >
                <RotateCcw className="h-5 w-5 transition-transform duration-500 ease-out group-hover:-rotate-180" aria-hidden />
                <span>เริ่มนับกองใหม่</span>
              </button>
            </div>
          </section>

          {/* Right Info Panels */}
          <aside className="space-y-5">
            {/* Multiplayer / Turn Mode Panel */}
            <div>
              <div className="sketchy-panel bg-white/90 p-5 paper-tilt-left">
                {roomId ? (
                  // Online Room Mode
                  <>
                    <div className="flex items-center gap-2 font-hand text-xl font-bold text-ink-900">
                      <Users className="h-5 w-5 text-ink-800" aria-hidden />
                      <span>ห้องเล่นออนไลน์ (Realtime)</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-1 font-hand text-sm font-bold text-ink-900">
                      <span>รหัสห้อง: {roomId}</span>
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500 border border-ink-800 animate-ping" />
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={copyInviteLink}
                        className="btn-doodle w-full flex items-center justify-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-lemon px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft text-ink-900"
                        style={{ "--btn-hover-rotate": "1deg" } as React.CSSProperties}
                      >
                        {isCopied ? "คัดลอกลิงก์สำเร็จ! 🎉" : "คัดลอกลิงก์เชิญ 📋"}
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-ink-700 leading-relaxed">
                      ส่งลิงก์เชิญให้เพื่อนกรอกชื่อ เพื่อเข้ามาร่วมวงดูไพ่เปิดไปพร้อมกันแบบเรียลไทม์ได้เลย!
                    </p>

                    <div className="mt-4 font-hand text-base font-bold text-ink-900">
                      <span>เพื่อนร่วมวง ({players.length} คน):</span>
                    </div>

                    {/* Online Players List */}
                    {players.length > 0 ? (
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                        {players.map((player) => (
                          <div
                            key={player}
                            className="flex items-center gap-2 rounded-note border border-ink-800 bg-paper-50/80 px-3 py-1.5 font-hand text-base shadow-sketch-soft text-ink-900"
                          >
                            <span className="h-3 w-3 rounded-full bg-green-500 border border-ink-800 shrink-0" />
                            <span className="truncate font-semibold text-ink-900 flex-1">
                              {player} {player === myNickname ? "(คุณ)" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-center font-hand text-sm text-ink-500 italic">
                        กำลังเชื่อมต่อสมาชิก...
                      </p>
                    )}

                    <div className="mt-4 border-t border-dashed border-ink-800/20 pt-4">
                      <button
                        type="button"
                        onClick={exitRoom}
                        className="btn-doodle w-full flex items-center justify-center gap-2 rounded-note border-2 border-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft text-red-900"
                        style={{ "--btn-hover-rotate": "-1deg" } as React.CSSProperties}
                      >
                        <span>ออกจากห้องออนไลน์ ✕</span>
                      </button>
                    </div>
                  </>
                ) : (
                  // Offline Mode
                  <>
                    <div className="flex items-center gap-2 font-hand text-xl font-bold text-ink-900">
                      <Users className="h-5 w-5 text-ink-800" aria-hidden />
                      <span>ผู้ตอบคำถาม (Multiplayer)</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-700 leading-relaxed">
                      ใส่ชื่อเพื่อนหรือแฟนลงไป ระบบจะเวียนคนตอบตามลำดับรายชื่อเมื่อเปิดการ์ดแต่ละใบ!
                    </p>

                    {/* Input for new player */}
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        placeholder="พิมพ์ชื่อ..."
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-1.5 font-hand text-base text-ink-900 placeholder-ink-700/50 focus:outline-none focus:ring-2 focus:ring-ink-800/40"
                        maxLength={15}
                      />
                      <button
                        type="button"
                        onClick={addPlayer}
                        className="btn-doodle flex items-center justify-center rounded-note border-2 border-ink-800 bg-doodle-lemon px-4 font-hand text-lg font-bold shadow-sketch-soft text-ink-900"
                        style={{ "--btn-hover-rotate": "1.5deg" } as React.CSSProperties}
                      >
                        เพิ่ม
                      </button>
                    </div>

                    {/* Player list */}
                    {players.length > 0 ? (
                      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                        {players.map((player) => (
                          <div
                            key={player}
                            className="flex items-center justify-between gap-2 rounded-note border border-ink-800 bg-paper-50/80 px-3 py-1.5 font-hand text-base shadow-sketch-soft text-ink-900"
                          >
                            <span className="truncate font-semibold text-ink-900">{player}</span>
                            <button
                              type="button"
                              onClick={() => removePlayer(player)}
                              className="text-red-500 hover:text-red-400 font-bold px-1 transition-colors text-sm hover:scale-110"
                              title="ลบรายชื่อ"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-center font-hand text-sm text-ink-500 italic">
                        ยังไม่มีผู้เล่นร่วมวง...
                      </p>
                    )}

                    <div className="mt-4 border-t border-dashed border-ink-800/20 pt-4">
                      <button
                        type="button"
                        onClick={createRoom}
                        className="btn-doodle w-full flex items-center justify-center gap-2 rounded-note border-2 border-ink-800 bg-white hover:bg-doodle-peach/20 px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft text-ink-900"
                        style={{ "--btn-hover-rotate": "-1deg" } as React.CSSProperties}
                      >
                        <Sparkles className="h-5 w-5 text-ink-800" />
                        <span>สร้างห้องเล่นออนไลน์ ✨</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Round Status Info */}
            <div>
              <div className="sketchy-panel bg-white/90 p-5 paper-tilt-right">
                <div className="flex items-center gap-2 font-hand text-xl font-bold">
                  <RefreshCw className="h-5 w-5 text-ink-800" aria-hidden />
                  <span>สถานะกองคำถาม</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  ใช้ไปแล้ว <strong className="text-base text-ink-900">{usedIds.size}</strong> จากทั้งหมด{" "}
                  <strong className="text-base text-ink-900">{questionPool.length}</strong> ใบ (เหลืออีก {remainingCount} ใบ)
                </p>

                {/* Graphical Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
                    <span>ความคืบหน้า</span>
                    <span>
                      {Math.round((usedIds.size / Math.max(questionPool.length, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-paper-50 rounded-full border-2 border-ink-800 h-4 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(usedIds.size / Math.max(questionPool.length, 1)) * 100}%`,
                        backgroundColor: currentCategory.accent,
                      }}
                    />
                  </div>
                </div>

                {roundNotice ? (
                  <p className="mt-4 rounded-note border border-ink-800 bg-doodle-lemon/45 px-3 py-2 text-xs font-semibold leading-relaxed">
                    {roundNotice}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Mindful Tips */}
            <div>
              <div className="sketchy-panel bg-white/90 p-5 paper-tilt-left">
                <div className="flex items-center gap-2 font-hand text-xl font-bold text-ink-800">
                  <BookOpenText className="h-5 w-5" aria-hidden />
                  <span>จังหวะของการ์ดนี้</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  การตั้งใจฟังมีความหมายเท่ากับคำตอบ ถ้าคำถามหนักหน่วงเกินไป
                  คุณสามารถเลือกพัก หายใจ แล้วจั่วใบใหม่ได้เสมอโดยไม่มีใครตัดสิน
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Nickname Prompt Dialog Modal */}
      <AnimatePresence>
        {showNamePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-full max-w-md sketchy-panel bg-white p-6 shadow-sketch-strong text-ink-900"
            >
              <h3 className="font-hand text-2xl font-bold text-ink-900 text-center flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-doodle-peach animate-bounce" />
                <span>ยินดีต้อนรับร่วมวง! 🎈</span>
              </h3>
              
              <p className="mt-3 font-hand text-base text-ink-700 leading-relaxed text-center">
                กรุณากรอกชื่อเล่นของคุณเพื่อเข้าร่วมห้องเล่นออนไลน์แบบเรียลไทม์กับเพื่อนๆ
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget.elements.namedItem("nickname") as HTMLInputElement;
                  handleJoinRoomWithName(target.value);
                }}
                className="mt-5 space-y-4"
              >
                <div>
                  <label htmlFor="nickname-input" className="sr-only">ชื่อเล่นของคุณ</label>
                  <input
                    id="nickname-input"
                    name="nickname"
                    type="text"
                    required
                    placeholder="กรอกชื่อเล่นสุดคิ้วท์ที่นี่..."
                    maxLength={15}
                    className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-4 py-2 font-hand text-lg text-ink-900 placeholder-ink-700/40 focus:outline-none focus:ring-2 focus:ring-ink-800/40"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={exitRoom}
                    className="btn-doodle flex-1 rounded-note border-2 border-ink-800 bg-white py-2 font-hand text-lg font-bold shadow-sketch-soft text-ink-900"
                    style={{ "--btn-hover-rotate": "-1deg" } as React.CSSProperties}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn-doodle flex-1 rounded-note border-2 border-ink-800 bg-doodle-lemon py-2 font-hand text-lg font-bold shadow-sketch-soft text-ink-900"
                    style={{ "--btn-hover-rotate": "1.5deg" } as React.CSSProperties}
                  >
                    ร่วมวงเลย! 🚀
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Sound Control Panel */}
      <AmbientControl />
    </main>
  );
}
