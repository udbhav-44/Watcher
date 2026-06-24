"use client";

import { useEffect, useState } from "react";

type Listener = (state: PlayerState) => void;

export type ActivePlayer = {
  titleId: string;
  title: string;
  src: string;
  poster?: string | null;
  mediaType: "movie" | "tv" | "anime";
  season?: number | null;
  episode?: number | null;
  episodeName?: string | null;
};

export type PlayerState = {
  active: ActivePlayer | null;
  minimized: boolean;
};

const STORAGE_KEY = "campusstream:active-player";
const INITIAL_STATE: PlayerState = { active: null, minimized: false };

/**
 * Hydration note: we intentionally do NOT rehydrate from sessionStorage at
 * module load. That used to cause a server/client mismatch — the server
 * renders with the empty initial state but the browser would have already
 * restored state on module evaluation, painting a mini-player div that
 * had no SSR counterpart.
 *
 * Instead, `usePlayerState` starts with the empty state (matching SSR) and
 * runs restore() inside an effect after the first paint. Subscribers
 * receive the restored state via the normal notify channel.
 */

let state: PlayerState = INITIAL_STATE;
let restored = false;
const listeners = new Set<Listener>();

const persist = (): void => {
  if (typeof window === "undefined") return;
  if (!state.active) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const restoreFromStorage = (): void => {
  if (typeof window === "undefined") return;
  if (restored) return;
  restored = true;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as PlayerState;
    if (parsed && typeof parsed === "object" && parsed.active) {
      state = parsed;
      listeners.forEach((listener) => listener(state));
    }
  } catch {
    // ignore
  }
};

const notify = (): void => {
  listeners.forEach((listener) => listener(state));
  persist();
};

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
};

export const setActivePlayer = (active: ActivePlayer | null): void => {
  state = { ...state, active, minimized: active ? state.minimized : false };
  notify();
};

export const setMinimized = (minimized: boolean): void => {
  if (!state.active) return;
  state = { ...state, minimized };
  notify();
};

export const closePlayer = (): void => {
  state = { active: null, minimized: false };
  notify();
};

export const usePlayerState = (): PlayerState => {
  // Always start with the SSR-safe empty state so client and server agree
  // on the initial render.
  const [snapshot, setSnapshot] = useState<PlayerState>(INITIAL_STATE);
  useEffect(() => {
    restoreFromStorage();
    return subscribe(setSnapshot);
  }, []);
  return snapshot;
};
