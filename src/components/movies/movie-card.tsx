"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import type { MovieCard as MovieCardType } from "@/lib/types";

type Props = {
  movie: MovieCardType;
};

export const MovieCard = ({ movie }: Props): JSX.Element => {
  return (
    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.2 }} className="group">
      <Link href={`/title/${movie.titleId}`} className="block overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width:768px) 50vw, 20vw"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-cyan-500/25 to-violet-500/25" />
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-1 text-sm font-semibold">{movie.title}</p>
          <p className="text-xs text-white/70">
            {movie.releaseYear ?? "TBA"} {movie.maturityRating ? `• ${movie.maturityRating}` : ""}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};
