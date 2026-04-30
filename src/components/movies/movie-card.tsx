"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";

import type { MovieCard as MovieCardType } from "@/lib/types";

type Props = {
  movie: MovieCardType;
};

export const MovieCard = ({ movie }: Props): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2 }}
      className="group w-[168px] shrink-0 sm:w-[184px] lg:w-[196px]"
    >
      <Link
        href={`/title/${movie.titleId}`}
        className="block overflow-hidden rounded-lg border border-white/10 bg-[#121212] shadow-[0_16px_34px_rgba(0,0,0,0.28)] transition outline-none hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#1a1a1a]">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width:768px) 50vw, 20vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a] px-4 text-center text-xs text-white/45">
              Artwork unavailable
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/8 to-transparent opacity-80" />
          <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-lg transition group-focus-within:opacity-100 group-hover:opacity-100">
            <Play className="h-4 w-4 fill-current" />
          </div>
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-1 text-sm font-medium text-white">
            {movie.title}
          </p>
          <p className="text-xs text-white/56">
            {movie.releaseYear ?? "TBA"}{" "}
            {movie.maturityRating ? `• ${movie.maturityRating}` : ""}
          </p>
          <p className="line-clamp-1 text-xs text-[#d8c49a]">
            {movie.genres.slice(0, 2).join(" • ")}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};
