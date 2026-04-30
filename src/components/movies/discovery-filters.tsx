import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  action: "/search" | "/browse";
  query?: string;
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  sort?: "popularity" | "release_date" | "rating";
  submitLabel: string;
};

export const DiscoveryFilters = ({
  action,
  query,
  genre,
  yearFrom,
  yearTo,
  sort,
  submitLabel
}: Props): JSX.Element => {
  return (
    <form
      className="surface-panel grid gap-3 rounded-lg p-4 md:grid-cols-12"
      action={action}
    >
      {action === "/search" && (
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
      <div className={action === "/search" ? "md:col-span-2" : "md:col-span-3"}>
        <label
          htmlFor="genre"
          className="mb-1 block text-xs tracking-wide text-white/56 uppercase"
        >
          Genre
        </label>
        <Input
          id="genre"
          name="genre"
          defaultValue={genre ?? ""}
          placeholder="Drama"
        />
      </div>
      <div className={action === "/search" ? "md:col-span-2" : "md:col-span-3"}>
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
      <div className={action === "/search" ? "md:col-span-2" : "md:col-span-3"}>
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
      <div className={action === "/search" ? "md:col-span-2" : "md:col-span-3"}>
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
          className={action === "/search" ? "w-full md:w-auto" : undefined}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
