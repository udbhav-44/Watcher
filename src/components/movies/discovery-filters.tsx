import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Scope = "movie" | "tv";

type Props = {
  action: "/search" | "/browse" | "/tv";
  query?: string;
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  sort?: "popularity" | "release_date" | "rating";
  language?: string;
  scope?: Scope;
  submitLabel: string;
};

const movieGenreOptions = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western"
];

const tvGenreOptions = [
  "Action & Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Kids",
  "Mystery",
  "News",
  "Reality",
  "Sci-Fi & Fantasy",
  "Soap",
  "Talk",
  "War & Politics",
  "Western"
];

const languageOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "Any language" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ru", label: "Russian" },
  { value: "pt", label: "Portuguese" }
];

export const DiscoveryFilters = ({
  action,
  query,
  genre,
  yearFrom,
  yearTo,
  sort,
  language,
  scope = "movie",
  submitLabel
}: Props): JSX.Element => {
  const genres = scope === "tv" ? tvGenreOptions : movieGenreOptions;
  const isSearch = action === "/search";

  return (
    <form
      className="surface-panel grid gap-3 rounded-lg p-4 md:grid-cols-12"
      action={action}
    >
      {isSearch && (
        <div className="md:col-span-4">
          <label
            htmlFor="q"
            className="mb-1 block text-xs tracking-wide text-white/56 uppercase"
          >
            Title or keyword
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Inception"
          />
        </div>
      )}
      <div className={isSearch ? "md:col-span-2" : "md:col-span-3"}>
        <label
          htmlFor="genre"
          className="mb-1 block text-xs tracking-wide text-white/56 uppercase"
        >
          Genre
        </label>
        <select
          id="genre"
          name="genre"
          defaultValue={genre ?? ""}
          className="h-10 w-full rounded-lg border border-white/15 bg-black/35 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70"
        >
          <option value="">Any genre</option>
          {genres.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </div>
      <div className={isSearch ? "md:col-span-2" : "md:col-span-2"}>
        <label
          htmlFor="yearFrom"
          className="mb-1 block text-xs tracking-wide text-white/56 uppercase"
        >
          From year
        </label>
        <Input
          id="yearFrom"
          name="yearFrom"
          defaultValue={yearFrom ?? ""}
          placeholder="2000"
        />
      </div>
      <div className={isSearch ? "md:col-span-2" : "md:col-span-2"}>
        <label
          htmlFor="yearTo"
          className="mb-1 block text-xs tracking-wide text-white/56 uppercase"
        >
          To year
        </label>
        <Input
          id="yearTo"
          name="yearTo"
          defaultValue={yearTo ?? ""}
          placeholder="2026"
        />
      </div>
      <div className={isSearch ? "md:col-span-1" : "md:col-span-2"}>
        <label
          htmlFor="language"
          className="mb-1 block text-xs tracking-wide text-white/56 uppercase"
        >
          Language
        </label>
        <select
          id="language"
          name="language"
          defaultValue={language ?? "all"}
          className="h-10 w-full rounded-lg border border-white/15 bg-black/35 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70"
        >
          {languageOptions.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>
      <div className={isSearch ? "md:col-span-1" : "md:col-span-3"}>
        <label
          htmlFor="sort"
          className="mb-1 block text-xs tracking-wide text-white/56 uppercase"
        >
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={sort ?? "popularity"}
          className="h-10 w-full rounded-lg border border-white/15 bg-black/35 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70"
        >
          <option value="popularity">Popularity</option>
          <option value="release_date">Release date</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <div className="md:col-span-12">
        <Button
          type="submit"
          className={isSearch ? "w-full md:w-auto" : undefined}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
