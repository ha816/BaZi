"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * localStorage/sessionStorage 값을 hydration-safe 하게 읽는다.
 * - 서버 렌더·하이드레이션 중: null (아직 모름)
 * - 클라이언트: 저장된 문자열, 없으면 ""
 * 마운트 effect 안에서 setState 하던 패턴(react-hooks/set-state-in-effect)을 대체한다.
 */
export function useStorageValue(key: string, area: "local" | "session" = "local"): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        const store = area === "local" ? window.localStorage : window.sessionStorage;
        return store.getItem(key) ?? "";
      } catch {
        return "";
      }
    },
    () => null,
  );
}

/** 저장소에서 읽은 JSON 문자열 → 객체. 비어 있거나 깨졌으면 null. */
export function parseStored<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
