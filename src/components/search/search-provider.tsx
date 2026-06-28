"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type SearchContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export const SearchProvider = ({
  children
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);
  const toggleSearch = useCallback(() => setOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ open, openSearch, closeSearch, toggleSearch }),
    [open, openSearch, closeSearch, toggleSearch]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearchCommand = (): SearchContextValue => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchCommand must be used within SearchProvider");
  }
  return context;
};
