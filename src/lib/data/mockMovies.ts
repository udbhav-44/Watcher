import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import type { MovieCard } from "@/lib/types";

export const mockMovies: MovieCard[] = [
  {
    id: "m1",
    titleId: "tt12042730",
    title: "Project Hail Mary (Concept)",
    synopsis: "A high-stakes sci-fi mission blends memory fragments and survival.",
    posterUrl: "/posters/project-hail-mary.svg",
    backdropUrl: null,
    releaseYear: 2026,
    durationMinutes: 128,
    maturityRating: "U/A 13+",
    playableUrl: toPlayableUrl("tt12042730"),
    sourceProvider: "playimdb",
    genres: ["Sci-Fi", "Drama"]
  },
  {
    id: "m2",
    titleId: "tt1375666",
    title: "Inception",
    synopsis: "A thief enters dream layers to implant an idea that can change everything.",
    posterUrl: "/posters/inception.svg",
    backdropUrl: null,
    releaseYear: 2010,
    durationMinutes: 148,
    maturityRating: "U/A 13+",
    playableUrl: toPlayableUrl("tt1375666"),
    sourceProvider: "playimdb",
    genres: ["Sci-Fi", "Thriller"]
  },
  {
    id: "m3",
    titleId: "tt0816692",
    title: "Interstellar",
    synopsis: "Explorers travel through a wormhole in space to ensure humanity survives.",
    posterUrl: "/posters/interstellar.svg",
    backdropUrl: null,
    releaseYear: 2014,
    durationMinutes: 169,
    maturityRating: "U/A 13+",
    playableUrl: toPlayableUrl("tt0816692"),
    sourceProvider: "playimdb",
    genres: ["Sci-Fi", "Adventure"]
  }
];
