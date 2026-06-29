"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  DoorOpen,
  Eye,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Users,
} from "lucide-react";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";
import type { TalkModeId } from "@/lib/talk-modes";

type AnalyticsEvent = {
  id: string;
  event_type: string;
  occurred_at: string;
  session_id: string | null;
  talk_mode: string | null;
  category_slug: string | null;
  question_id: string | null;
  depth: number | null;
  audience: string | null;
  room_id: string | null;
  page_path: string | null;
};

type CategoryLookup = {
  slug: string;
  name: string;
};

type QuestionLookup = {
  id: string;
  question: string;
  category_id: string;
};

type AdminDashboardProps = {
  talkMode: TalkModeId;
  categories: CategoryLookup[];
  questions: QuestionLookup[];
};

type RangeDays = 3 | 7 | 30;

const rangeOptions: { days: RangeDays; label: string }[] = [
  { days: 3, label: "3 วัน" },
  { days: 7, label: "อาทิตย์" },
  { days: 30, label: "เดือน" },
];

const audienceLabels: Record<string, string> = {
  self: "ตัวเอง",
  friends: "เพื่อน",
  talking_stage: "กำลังคุย",
  couple: "คู่รัก",
  family: "ครอบครัว",
};

const depthLabels: Record<number, string> = {
  1: "เบา ๆ",
  2: "คุยสบาย",
  3: "ลึกปานกลาง",
  4: "ลึกมาก",
  5: "ลึกสุด",
};

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00`);
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function shouldShowChartLabel(index: number, total: number, rangeDays: RangeDays) {
  if (rangeDays <= 7) {
    return true;
  }

  const step = Math.max(Math.ceil(total / 6), 1);
  return index % step === 0 || index === total - 1;
}

function countByKey<T extends string | number>(items: T[]) {
  const map = new Map<T, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return map;
}

function getCategorySlugFromEvent(event: AnalyticsEvent) {
  if (event.category_slug) {
    return event.category_slug;
  }

  if (event.page_path?.startsWith("/play/")) {
    return event.page_path.replace("/play/", "").split("?")[0] || null;
  }

  return null;
}

function getSetupContextEvents(events: AnalyticsEvent[]) {
  return events.filter((event) =>
    ["play_start", "page_view", "card_draw", "card_open"].includes(event.event_type),
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Eye;
  accent: string;
}) {
  return (
    <div className="sketchy-panel border-2 border-ink-800 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-hand text-lg font-bold text-ink-700">{label}</span>
        <span
          className="admin-stat-icon inline-flex h-10 w-10 items-center justify-center rounded-note border-2 border-ink-800 shadow-sketch-soft"
          style={{ "--admin-icon-accent": accent } as React.CSSProperties}
        >
          <Icon className="h-5 w-5 text-ink-900" />
        </span>
      </div>
      <p className="font-hand text-4xl font-bold text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-sm font-semibold text-ink-600">{hint}</p> : null}
    </div>
  );
}

export function AdminDashboard({ talkMode, categories, questions }: AdminDashboardProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      setError("ไม่พบการเชื่อมต่อ Supabase");
      setLoading(false);
      return;
    }

    const since = new Date();
    since.setDate(since.getDate() - rangeDays);

    const { data, error: queryError } = await supabase
      .from("analytics_events")
      .select(
        "id, event_type, occurred_at, session_id, talk_mode, category_slug, question_id, depth, audience, room_id, page_path",
      )
      .gte("occurred_at", since.toISOString())
      .order("occurred_at", { ascending: false });

    if (queryError) {
      const message =
        queryError.code === "42P01"
          ? "ยังไม่มีตาราง analytics_events กรุณารัน migration 0009 และ 0010 บน Supabase"
          : queryError.message;
      setError(message);
      setEvents([]);
    } else {
      setEvents((data as AnalyticsEvent[]) ?? []);
    }

    setLoading(false);
  }, [rangeDays]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const filteredEvents = useMemo(
    () => events.filter((event) => !event.talk_mode || event.talk_mode === talkMode),
    [events, talkMode],
  );

  const stats = useMemo(() => {
    const pageViews = filteredEvents.filter((event) => event.event_type === "page_view");
    const playStarts = filteredEvents.filter((event) => event.event_type === "play_start");
    const cardDraws = filteredEvents.filter((event) => event.event_type === "card_draw");
    const cardOpens = filteredEvents.filter((event) => event.event_type === "card_open");
    const deckResets = filteredEvents.filter((event) => event.event_type === "deck_reset");
    const roomCreates = filteredEvents.filter((event) => event.event_type === "room_create");

    const uniqueSessions = new Set(
      filteredEvents.map((event) => event.session_id).filter((id): id is string => Boolean(id)),
    ).size;

    const openRate =
      cardDraws.length > 0 ? Math.round((cardOpens.length / cardDraws.length) * 100) : 0;

    const dailyMap = new Map<string, number>();
    for (const event of pageViews) {
      const day = formatDayKey(new Date(event.occurred_at));
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }

    const dailyTraffic = Array.from({ length: rangeDays }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (rangeDays - 1 - index));
      const dayKey = formatDayKey(date);
      return {
        dayKey,
        label: formatDayLabel(dayKey),
        count: dailyMap.get(dayKey) ?? 0,
      };
    });

    const maxDaily = Math.max(...dailyTraffic.map((day) => day.count), 1);

    const categoryActivityEvents = filteredEvents.filter((event) =>
      ["play_start", "page_view", "card_draw", "card_open"].includes(event.event_type),
    );

    const categoryCounts = countByKey(
      categoryActivityEvents
        .map((event) => getCategorySlugFromEvent(event))
        .filter((slug): slug is string => Boolean(slug)),
    );

    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug, count]) => ({
        slug,
        name: categories.find((category) => category.slug === slug)?.name ?? slug,
        count,
      }));

    const questionCounts = countByKey(
      cardOpens
        .map((event) => event.question_id)
        .filter((id): id is string => Boolean(id)),
    );

    const topQuestions = Array.from(questionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([questionId, count]) => {
        const question = questions.find((item) => item.id === questionId);
        return {
          id: questionId,
          text: question?.question ?? `คำถาม #${questionId.slice(0, 8)}`,
          count,
        };
      });

    const setupEvents = getSetupContextEvents(filteredEvents);

    const audienceCounts = countByKey(
      setupEvents
        .map((event) => event.audience)
        .filter((audience): audience is string => Boolean(audience)),
    );

    const audienceBreakdown = Array.from(audienceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([audience, count]) => ({
        audience,
        label: audienceLabels[audience] ?? audience,
        count,
      }));

    const depthCounts = countByKey(
      setupEvents
        .map((event) => event.depth)
        .filter((depth): depth is number => depth !== null && depth !== undefined),
    );

    const depthBreakdown = Array.from(depthCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([depth, count]) => ({
        depth,
        label: depthLabels[depth] ?? `ระดับ ${depth}`,
        count,
      }));

    const homeViews = pageViews.filter((event) => event.page_path === "/").length;
    const playViews = pageViews.filter((event) => event.page_path?.startsWith("/play/")).length;

    return {
      pageViews: pageViews.length,
      uniqueSessions,
      playStarts: playStarts.length,
      cardDraws: cardDraws.length,
      cardOpens: cardOpens.length,
      deckResets: deckResets.length,
      roomCreates: roomCreates.length,
      openRate,
      dailyTraffic,
      maxDaily,
      topCategories,
      topQuestions,
      audienceBreakdown,
      depthBreakdown,
      homeViews,
      playViews,
    };
  }, [filteredEvents, rangeDays, categories, questions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-800 border-t-transparent" />
        <p className="mt-4 font-hand text-xl font-bold text-ink-700">กำลังโหลดสถิติ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sketchy-panel border-2 border-ink-800 bg-doodle-peach/30 p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-ink-900" />
        <h3 className="mt-4 font-hand text-2xl font-bold">ไม่สามารถโหลดสถิติได้</h3>
        <p className="mt-2 text-ink-800">{error}</p>
        <button
          type="button"
          onClick={() => void fetchAnalytics()}
          className="btn-doodle mt-4 rounded-note border-2 border-ink-800 bg-white px-4 py-2 font-hand text-lg font-bold shadow-sketch"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="sketchy-panel flex flex-col gap-4 border-2 border-ink-800 bg-white/70 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border-2 border-ink-800 bg-doodle-lilac px-3 py-1 font-hand text-sm font-bold shadow-sketch-soft">
            <BarChart3 className="admin-badge-icon h-4 w-4 text-ink-900" />
            <span>Dashboard</span>
          </div>
          <h2 className="font-hand text-2xl font-bold text-ink-900">สถิติการใช้งาน</h2>
          <p className="text-sm font-semibold text-ink-600">
            ข้อมูลย้อนหลัง {rangeDays} วัน · โหมด{" "}
            {talkMode === "deep" ? "อบอุ่นใจ (Deep Talk)" : "คุยเปิดโลก (Interesting Talk)"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchAnalytics()}
          className="btn-doodle inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-2 font-hand text-base font-bold shadow-sketch-soft"
        >
          <RefreshCw className="h-4 w-4" />
          รีเฟรช
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="rounded-note border-2 border-dashed border-ink-800/25 bg-paper-50 px-4 py-3 font-hand text-base font-semibold text-ink-600">
          ยังไม่มี event ในช่วงเวลานี้ — ลองเปิดหน้าหลัก เลือกหมวด แล้วจั่ว/เปิดไพ่ จากนั้นกดรีเฟรช (ต้องรัน migration 0009 และ 0010 บน Supabase ด้วย)
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ยอดเข้าชมหน้า" value={stats.pageViews} hint={`หน้าหลัก ${stats.homeViews} · เล่น ${stats.playViews}`} icon={Eye} accent="#b9d9f2" />
        <StatCard label="เซสชันผู้ใช้" value={stats.uniqueSessions} hint="นับจาก session ไม่ซ้ำ" icon={Users} accent="#ccebd9" />
        <StatCard label="เริ่มเล่น" value={stats.playStarts} hint="กดเริ่มจากหน้าเลือกหมวด" icon={Play} accent="#f7e7a7" />
        <StatCard label="เปิดไพ่" value={stats.cardOpens} hint={`อัตราเปิด ${stats.openRate}% จากการจั่ว`} icon={DoorOpen} accent="#f3b8c6" />
        <StatCard label="จั่วไพ่" value={stats.cardDraws} icon={Shuffle} accent="#d9c9ef" />
        <StatCard label="รีเซ็ตกอง" value={stats.deckResets} icon={RotateCcw} accent="#ffd5bd" />
        <StatCard label="สร้างห้องออนไลน์" value={stats.roomCreates} icon={Users} accent="#b9d9f2" />
        <StatCard
          label="หมวดยอดนิยม"
          value={stats.topCategories[0]?.name ?? "-"}
          hint={stats.topCategories[0] ? `${stats.topCategories[0].count} ครั้ง` : "ยังไม่มีข้อมูล"}
          icon={Layers}
          accent="#f7e7a7"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="sketchy-panel border-2 border-ink-800 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="font-hand text-xl font-bold text-ink-900">Traffic รายวัน (Page View)</h3>
            <div className="flex shrink-0 items-center gap-1 rounded-note border-2 border-ink-800 bg-paper-50 p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => setRangeDays(option.days)}
                  className={`btn-doodle rounded-note px-2.5 py-1 font-hand text-xs font-bold sm:px-3 sm:text-sm ${
                    rangeDays === option.days
                      ? "border-2 border-ink-800 bg-doodle-sky shadow-sketch-soft"
                      : "border border-transparent bg-transparent text-ink-600 hover:bg-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {stats.pageViews === 0 ? (
            <p className="font-hand text-lg italic text-ink-500">ยังไม่มีข้อมูล traffic ในช่วงเวลานี้</p>
          ) : (
            <div className="flex h-52 items-end gap-1 sm:gap-1.5">
              {stats.dailyTraffic.map((day, index) => {
                const barHeight = Math.max(
                  Math.round((day.count / stats.maxDaily) * 148),
                  day.count > 0 ? 14 : 4,
                );
                const showLabel = shouldShowChartLabel(
                  index,
                  stats.dailyTraffic.length,
                  rangeDays,
                );
                const label = showLabel ? formatDayLabel(day.dayKey) : "";

                return (
                  <div
                    key={day.dayKey}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10px] font-bold leading-none text-ink-600 sm:text-xs">
                      {day.count > 0 ? day.count : ""}
                    </span>
                    <div
                      className="admin-chart-bar w-full rounded-t-md border-2 border-ink-800 bg-doodle-sky transition-all"
                      style={{
                        height: `${barHeight}px`,
                        "--admin-icon-accent": "#38bdf8",
                      } as React.CSSProperties}
                      title={`${formatDayLabel(day.dayKey)}: ${day.count} views`}
                    />
                    <span
                      className="h-4 truncate text-center text-[9px] font-semibold leading-tight text-ink-500 sm:text-[10px]"
                      aria-hidden={!showLabel}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sketchy-panel border-2 border-ink-800 bg-white p-6">
          <h3 className="mb-1 font-hand text-xl font-bold text-ink-900">หมวดหมู่ยอดนิยม</h3>
          <p className="mb-4 text-sm font-semibold text-ink-600">รวมจากเข้าชมหน้าเล่น · จั่วไพ่ · เปิดไพ่</p>
          {stats.topCategories.length === 0 ? (
            <p className="font-hand text-lg italic text-ink-500">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-3">
              {stats.topCategories.map((category, index) => (
                <li key={category.slug} className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink-800 bg-doodle-lemon font-hand text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-hand text-lg font-bold text-ink-900">{category.name}</p>
                    <p className="text-xs font-semibold text-ink-500">{category.slug}</p>
                  </div>
                  <span className="rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-1 font-hand text-base font-bold">
                    {category.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="sketchy-panel border-2 border-ink-800 bg-white p-6">
          <h3 className="mb-4 font-hand text-xl font-bold text-ink-900">คำถามที่ถูกเปิดบ่อย</h3>
          {stats.topQuestions.length === 0 ? (
            <p className="font-hand text-lg italic text-ink-500">ยังไม่มีข้อมูลการเปิดไพ่</p>
          ) : (
            <ul className="space-y-3">
              {stats.topQuestions.map((item, index) => (
                <li key={item.id} className="rounded-note border border-ink-800/15 bg-paper-50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-hand text-sm font-bold text-ink-500">#{index + 1}</span>
                    <span className="rounded border border-ink-800/20 bg-white px-2 py-0.5 font-hand text-sm font-bold">
                      {item.count} ครั้ง
                    </span>
                  </div>
                  <p className="line-clamp-2 font-hand text-base font-bold text-ink-900">{item.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div className="sketchy-panel border-2 border-ink-800 bg-white p-6">
            <h3 className="mb-1 font-hand text-xl font-bold text-ink-900">กลุ่มผู้เล่นที่เลือก</h3>
            <p className="mb-4 text-sm font-semibold text-ink-600">จากหน้าเล่นและการโต้ตอบกับไพ่</p>
            {stats.audienceBreakdown.length === 0 ? (
              <p className="font-hand text-lg italic text-ink-500">ยังไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-2">
                {stats.audienceBreakdown.map((item) => (
                  <li key={item.audience} className="flex items-center justify-between gap-3">
                    <span className="font-hand text-base font-bold text-ink-900">{item.label}</span>
                    <span className="rounded-note border border-ink-800/20 bg-doodle-mint/40 px-2.5 py-0.5 font-hand text-sm font-bold">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sketchy-panel border-2 border-ink-800 bg-white p-6">
            <h3 className="mb-1 font-hand text-xl font-bold text-ink-900">ระดับความลึกที่เลือก</h3>
            <p className="mb-4 text-sm font-semibold text-ink-600">จากหน้าเล่นและการโต้ตอบกับไพ่</p>
            {stats.depthBreakdown.length === 0 ? (
              <p className="font-hand text-lg italic text-ink-500">ยังไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-2">
                {stats.depthBreakdown.map((item) => (
                  <li key={item.depth} className="flex items-center justify-between gap-3">
                    <span className="font-hand text-base font-bold text-ink-900">
                      ระดับ {item.depth} · {item.label}
                    </span>
                    <span className="rounded-note border border-ink-800/20 bg-doodle-peach/40 px-2.5 py-0.5 font-hand text-sm font-bold">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
