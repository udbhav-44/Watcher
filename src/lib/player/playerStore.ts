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

export type PlaybackSnapshot = {
  currentTime: number;
  duration: number;
  progressPercent: number;
};

export type PlayerState = {
  active: ActivePlayer | null;
  minimized: boolean;
  playback: PlaybackSnapshot | null;
  paused: boolean;
  volume: number;
};

const STORAGE_KEY = "campusstream:active-player";
const INITIAL_STATE: PlayerState = {
  active: null,
  minimized: false,
  playback: null,
  paused: false,
  volume: 1
};

let state: PlayerState = INITIAL_STATE;
let restored = false;
const listeners = new Set<Listener>();

const persist = (): void => {
  if (typeof window === "undefined") return;
  if (!state.active) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      active: state.active,
      minimized: state.minimized,
      playback: state.playback,
      paused: state.paused,
      volume: state.volume
    })
  );
};

const restoreFromStorage = (): void => {
  if (typeof window === "undefined") return;
  if (restored) return;
  restored = true;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    if (parsed && typeof parsed === "object" && parsed.active) {
      state = {
        ...INITIAL_STATE,
        ...parsed,
        active: parsed.active
      };
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
  state = {
    ...state,
    active,
    minimized: active ? state.minimized : false,
    playback: active ? state.playback : null,
    paused: false
  };
  notify();
};

export const setMinimized = (minimized: boolean): void => {
  if (!state.active) return;
  state = { ...state, minimized };
  notify();
};

export const setPlaybackProgress = (playback: PlaybackSnapshot): void => {
  if (!state.active) return;
  state = { ...state, playback };
  listeners.forEach((listener) => listener(state));
  persist();
};

export const setPlayerPaused = (paused: boolean): void => {
  if (!state.active) return;
  state = { ...state, paused };
  notify();
};

export const setPlayerVolume = (volume: number): void => {
  if (!state.active) return;
  state = { ...state, volume: Math.max(0, Math.min(1, volume)) };
  notify();
};

export const closePlayer = (): void => {
  state = { ...INITIAL_STATE };
  notify();
};

export const usePlayerState = (): PlayerState => {
  const [snapshot, setSnapshot] = useState<PlayerState>(INITIAL_STATE);
  useEffect(() => {
    restoreFromStorage();
    return subscribe(setSnapshot);
  }, []);
  return snapshot;
};
