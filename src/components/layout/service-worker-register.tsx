"use client";

import { useEffect } from "react";

export const ServiceWorkerRegister = (): null => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:") return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW is a progressive enhancement — silent failure is fine.
    });
  }, []);
  return null;
};
