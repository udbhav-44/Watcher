import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import type { MovieCard } from "@/lib/types";

export const mockMovies: MovieCard[] = [
  {
    id: "m1",
    titleId: "tt12042730",
    title: "Project Hail Mary (Concept)",
    synopsis: "A high-stakes sci-fi mission blends memory fragments and survival.",
    posterUrl: "https://m.media-amazon.com/images/M/MV5BZWQxZjI1YjAtNzgzNS00NDE4LTgwYzctYmQ2M2MwN2VhMTY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg",
    releaseYear: 2026,
    durationMinutes: 128,
    maturityRating: "U/A 13+",
    playableUrl: toPlayableUrl("tt12042730"),
    genres: ["Sci-Fi", "Drama"]
  },
  {
    id: "m2",
    titleId: "tt1375666",
    title: "Inception",
    synopsis: "A thief enters dream layers to implant an idea that can change everything.",
    posterUrl: "https://m.media-amazon.com/images/M/MV5BMmE1MjQ3M2EtYmQ0MC00ZGI0LTljNmEtYzY0YjQwM2UwMTFlXkEyXkFqcGc@._V1_.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    releaseYear: 2010,
    durationMinutes: 148,
    maturityRating: "U/A 13+",
    playableUrl: toPlayableUrl("tt1375666"),
    genres: ["Sci-Fi", "Thriller"]
  },
  {
    id: "m3",
    titleId: "tt0816692",
    title: "Interstellar",
    synopsis: "Explorers travel through a wormhole in space to ensure humanity survives.",
    posterUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDQtYzViMi00ZTk0LWEzYzctZWQ5MmYzZmU2YjMwXkEyXkFqcGc@._V1_.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    releaseYear: 2014,
    durationMinutes: 169,
    maturityRating: "U/A 13+",
    playableUrl: toPlayableUrl("tt0816692"),
    genres: ["Sci-Fi", "Adventure"]
  }
];
