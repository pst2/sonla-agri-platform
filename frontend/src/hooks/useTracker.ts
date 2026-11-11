"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getVisitorId,
  getSessionId,
  isDemoPersonaActive,
  setDemoPersona,
  trackEvent,
  TrackedEventNotification,
} from "@/lib/tracker";
import { EventName } from "@/types";

export function useTracker() {
  const [visitorId, setVisitorId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<TrackedEventNotification | null>(
    null
  );

  useEffect(() => {
    setVisitorId(getVisitorId());
    setSessionId(getSessionId());
    setIsDemo(isDemoPersonaActive());

    const handlePersonaChange = () => {
      setVisitorId(getVisitorId());
      setSessionId(getSessionId());
      setIsDemo(isDemoPersonaActive());
    };

    const handleEventTracked = (e: Event) => {
      const customEv = e as CustomEvent<TrackedEventNotification>;
      setLastEvent(customEv.detail);
    };

    window.addEventListener("agri-persona-change", handlePersonaChange);
    window.addEventListener("agri-event-tracked", handleEventTracked);
    return () => {
      window.removeEventListener("agri-persona-change", handlePersonaChange);
      window.removeEventListener("agri-event-tracked", handleEventTracked);
    };
  }, []);

  const switchPersona = useCallback((enableDemo: boolean) => {
    const newId = setDemoPersona(enableDemo);
    setVisitorId(newId);
    setSessionId(getSessionId());
    setIsDemo(enableDemo);
    return newId;
  }, []);

  const track = useCallback(
    (
      eventName: EventName,
      options?: {
        content_type?: "product" | "article" | "page";
        content_id?: number;
        properties?: Record<string, unknown>;
      }
    ) => {
      return trackEvent(eventName, options);
    },
    []
  );

  return {
    visitorId,
    sessionId,
    isDemo,
    lastEvent,
    switchPersona,
    track,
  };
}

export function useScrollDepthTracker(
  contentType: "product" | "article",
  contentId?: number
) {
  const hasFiredRef = useRef<boolean>(false);

  useEffect(() => {
    hasFiredRef.current = false;
  }, [contentType, contentId]);

  useEffect(() => {
    if (!contentId) return;

    const handleScroll = () => {
      if (hasFiredRef.current) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (docHeight <= 0) return;
      const pct = (scrollTop / docHeight) * 100;
      if (pct >= 60) {
        hasFiredRef.current = true;
        trackEvent("scroll", {
          content_type: contentType,
          content_id: contentId,
          properties: { scroll_depth_pct: Math.round(pct) },
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [contentType, contentId]);
}
