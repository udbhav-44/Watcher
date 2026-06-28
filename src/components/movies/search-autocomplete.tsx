"use client";

import { SearchField } from "@/components/search/search-field";

type Props = {
  initialQuery?: string;
  voiceEnabled?: boolean;
};

export const SearchAutocomplete = ({
  initialQuery = ""
}: Props): JSX.Element => {
  return <SearchField initialQuery={initialQuery} variant="page" inputId="q" />;
};
