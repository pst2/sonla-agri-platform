import { EventName } from "@/types";

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return "http://localhost:8000/api/v1";
}

const VISITOR_STORAGE_KEY = "agri_visitor_id";
const LIVE_VISITOR_BACKUP_KEY = "agri_live_visitor_id";
const SESSION_STORAGE_KEY = "agri_session_id";
export const DEMO_VISITOR_ID = "demo_visitor_sonla";

export interface TrackedEventNotification {
  id: string;
  event_name: EventName;
  visitor_id: string;
  content_type?: string;
  content_id?: number;
  timestamp: string;
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr_visitor";
  let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!vid) {
    vid = generateId("vis");
    localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    localStorage.setItem(LIVE_VISITOR_BACKUP_KEY, vid);
  }
  return vid;
}

export function isDemoPersonaActive(): boolean {
  if (typeof window === "undefined") return false;
  return getVisitorId() === DEMO_VISITOR_ID;
}

export function setDemoPersona(enableDemo: boolean): string {
  if (typeof window === "undefined") return DEMO_VISITOR_ID;
  if (enableDemo) {
    const current = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (current && current !== DEMO_VISITOR_ID) {
      localStorage.setItem(LIVE_VISITOR_BACKUP_KEY, current);
    }
    localStorage.setItem(VISITOR_STORAGE_KEY, DEMO_VISITOR_ID);
    sessionStorage.setItem(SESSION_STORAGE_KEY, "demo_session_sonla_01");
    window.dispatchEvent(
      new CustomEvent("agri-persona-change", {
        detail: { visitor_id: DEMO_VISITOR_ID, isDemo: true },
      })
    );
    return DEMO_VISITOR_ID;
  } else {
    let liveId = localStorage.getItem(LIVE_VISITOR_BACKUP_KEY);
    if (!liveId || liveId === DEMO_VISITOR_ID) {
      liveId = generateId("vis");
      localStorage.setItem(LIVE_VISITOR_BACKUP_KEY, liveId);
    }
    localStorage.setItem(VISITOR_STORAGE_KEY, liveId);
    const newSess = generateId("sess");
    sessionStorage.setItem(SESSION_STORAGE_KEY, newSess);
    window.dispatchEvent(
      new CustomEvent("agri-persona-change", {
        detail: { visitor_id: liveId, isDemo: false },
      })
    );
    return liveId;
  }
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr_session";
  let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = isDemoPersonaActive() ? "demo_session_sonla_01" : generateId("sess");
    sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

export function detectDeviceType(): string {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export async function trackEvent(
  event_name: EventName,
  options?: {
    content_type?: "product" | "article" | "page";
    content_id?: number;
    properties?: Record<string, unknown>;
  }
): Promise<void> {
  if (typeof window === "undefined") return;
  const visitor_id = getVisitorId();
  const session_id = getSessionId();

  const notification: TrackedEventNotification = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    event_name,
    visitor_id,
    content_type: options?.content_type,
    content_id: options?.content_id,
    timestamp: new Date().toLocaleTimeString("vi-VN"),
  };

  window.dispatchEvent(
    new CustomEvent("agri-event-tracked", { detail: notification })
  );

  try {
    await fetch(`${getApiBaseUrl()}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id,
        session_id,
        event_name,
        content_type: options?.content_type || null,
        content_id: options?.content_id || null,
        properties: {
          path: window.location.pathname,
          ...(options?.properties || {}),
        },
        device_type: detectDeviceType(),
        referrer_source: document.referrer ? "referral" : "direct",
      }),
    });
  } catch {
    // Non-blocking telemetry
  }
}
