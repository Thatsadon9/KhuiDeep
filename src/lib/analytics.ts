"use client";

const SESSION_KEY = "khui-deep-session-id";

export type AnalyticsEventType =
  | "page_view"
  | "play_start"
  | "card_draw"
  | "card_open"
  | "deck_reset"
  | "room_create";

export type AnalyticsPayload = {
  talk_mode?: string | null;
  category_slug?: string | null;
  question_id?: string | null;
  depth?: number | null;
  audience?: string | null;
  room_id?: string | null;
  page_path?: string | null;
  metadata?: Record<string, unknown>;
};

function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

function buildAnalyticsRecord(eventType: AnalyticsEventType, payload: AnalyticsPayload) {
  return {
    event_type: eventType,
    session_id: getOrCreateSessionId(),
    talk_mode: payload.talk_mode ?? null,
    category_slug: payload.category_slug ?? null,
    question_id: payload.question_id ?? null,
    depth: payload.depth ?? null,
    audience: payload.audience ?? null,
    room_id: payload.room_id ?? null,
    page_path: payload.page_path ?? (typeof window !== "undefined" ? window.location.pathname : null),
    metadata: payload.metadata ?? {},
  };
}

export async function trackEventAsync(
  eventType: AnalyticsEventType,
  payload: AnalyticsPayload = {},
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || typeof window === "undefined") {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] skipped: missing Supabase env or browser context");
    }
    return false;
  }

  const record = buildAnalyticsRecord(eventType, payload);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(record),
      keepalive: true,
    });

    if (!response.ok) {
      const details = await response.text();
      if (process.env.NODE_ENV === "development") {
        console.warn("[analytics] insert failed", response.status, details);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] insert error", error);
    }
    return false;
  }
}

export function trackEvent(eventType: AnalyticsEventType, payload: AnalyticsPayload = {}) {
  void trackEventAsync(eventType, payload);
}
