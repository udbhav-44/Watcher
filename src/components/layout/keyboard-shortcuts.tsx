"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const isInputElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
};

export const KeyboardShortcuts = (): null => {
  const router = useRouter();

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isInputElement(event.target)) {
        if (event.key === "Escape" && event.target instanceof HTMLElement) {
          event.target.blur();
        }
        return;
      }

      switch (event.key) {
        case "/": {
          event.preventDefault();
          const input = document.querySelector<HTMLInputElement>("input#q");
          if (input) {
            input.focus();
            input.select();
          } else {
            router.push("/search");
          }
          break;
        }
        case "h":
          router.push("/");
          break;
        case "b":
          router.push("/browse");
          break;
        case "t":
          router.push("/tv");
          break;
        case "n":
          router.push("/new");
          break;
        case "w":
          router.push("/me/collections");
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return null;
};
