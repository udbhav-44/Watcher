"use client";

import { useEffect, useState } from "react";

type Listener = (state: PlayerState) => void;

export type ActivePlayer = {
  titleId: string;
  title: string;
  src: string;
  poster?: string | null;
  mediaType: "movie" | "tv";
  season?: number | null;
  episode?: number | null;
  episodeName?: string | null;
};

export type PlayerState = {
  active: ActivePlayer | null;
  minimized: boolean;
};

const STORAGE_KEY = "campusstream:active-player";

let state: PlayerState = { active: null, minimized: false };
const listeners = new Set<Listener>();

const persist = (): void => {
  if (typeof window === "undefined") return;
  if (!state.active) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const restore = (): void => {
  if (typeof window === "undefined") return;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as PlayerState;
    if (parsed && typeof parsed === "object") {
      state = parsed;
    }
  } catch {
    // ignore
  }
};

restore();

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
  const [snapshot, setSnapshot] = useState<PlayerState>(state);
  useEffect(() => subscribe(setSnapshot), []);
  return snapshot;
};
