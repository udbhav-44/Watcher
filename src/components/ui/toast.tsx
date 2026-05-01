"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 3500;

const variantStyles: Record<
  ToastVariant,
  { icon: ReactNode; ring: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
    ring: "border-emerald-400/30"
  },
  error: {
    icon: <TriangleAlert className="h-4 w-4 text-rose-300" />,
    ring: "border-rose-400/30"
  },
  info: {
    icon: <Info className="h-4 w-4 text-cyan-300" />,
    ring: "border-cyan-400/30"
  }
};

export const ToastProvider = ({
  children
}: {
  children: ReactNode;
}): JSX.Element => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((entry) => entry.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), DURATION_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info")
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const styles = variantStyles[toast.variant];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-full border bg-[#0d0d0d]/95 px-4 py-2 text-sm text-white shadow-lg ${styles.ring}`}
                role="status"
              >
                {styles.icon}
                <span className="line-clamp-2">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-full p-1 text-white/56 transition hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    if (typeof window === "undefined") {
      const noop: ToastContextValue = {
        show: () => undefined,
        success: () => undefined,
        error: () => undefined,
        info: () => undefined
      };
      return noop;
    }
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return context;
};
