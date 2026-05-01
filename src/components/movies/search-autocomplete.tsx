"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Search } from "lucide-react";

import { detailHrefFor } from "@/lib/catalog/titleId";

type Suggestion = {
  titleId: string;
  mediaType: "movie" | "tv";
  title: string;
  year: string | null;
  posterUrl: string | null;
};

type Props = {
  initialQuery?: string;
  voiceEnabled?: boolean;
};

const DEBOUNCE_MS = 220;

type SpeechRecognitionInstance = {
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
};

const getSpeechRecognitionCtor = (): (new () => SpeechRecognitionInstance) | null => {
  if (typeof window === "undefined") return null;
  const ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
      .SpeechRecognition ??
    (window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }).webkitSpeechRecognition;
  return ctor ?? null;
};

export const SearchAutocomplete = ({
  initialQuery = "",
  voiceEnabled = false
}: Props): JSX.Element => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(query.trim())}`,
          { credentials: "same-origin" }
        );
        if (!response.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await response.json()) as { results: Suggestion[] };
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const startVoice = (): void => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setQuery(transcript);
        router.push(`/search?q=${encodeURIComponent(transcript)}` as `/search?q=${string}`);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <div className="relative">
      <form
        action="/search"
        className="surface-panel flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2"
      >
        <Search className="h-4 w-4 text-white/56" />
        <input
          id="q"
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search titles, actors, genres..."
          aria-label="Search"
          autoComplete="off"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/45 outline-none"
        />
        {voiceEnabled && (
          <button
            type="button"
            onClick={startVoice}
            className="rounded-full p-1 text-white/56 transition hover:bg-white/10 hover:text-white"
            aria-label={listening ? "Listening" : "Start voice search"}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <button
          type="submit"
          className="rounded-full bg-[#f2c46d] px-3 py-1 text-xs font-semibold text-black"
        >
          Search
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-2 max-h-[320px] overflow-y-auto rounded-lg border border-white/15 bg-[#0d0d0d]/96 backdrop-blur">
          {suggestions.map((entry) => (
            <Link
              key={entry.titleId}
              href={detailHrefFor(entry.titleId)}
              prefetch
              className="flex items-center gap-3 border-b border-white/5 px-3 py-2 text-sm text-white/80 transition last:border-b-0 hover:bg-white/[0.06]"
            >
              <div className="relative h-12 w-9 overflow-hidden rounded bg-white/5">
                {entry.posterUrl ? (
                  <Image
                    src={entry.posterUrl}
                    alt={entry.title}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[#1a1a1a]" />
                )}
              </div>
              <div className="flex-1">
                <p className="line-clamp-1">
                  {entry.title}
                  <span className="ml-2 text-xs text-white/45">
                    {entry.mediaType === "tv" ? "TV" : "Movie"}
                  </span>
                </p>
                {entry.year && (
                  <p className="text-xs text-white/45">{entry.year}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
