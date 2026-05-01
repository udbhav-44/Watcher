"use client";

import { useEffect, useState } from "react";

type Status = {
  percent: number;
  watched: number;
  total: number;
};

type Props = {
  titleId: string;
};

export const SeriesCompletionBadge = ({
  titleId
}: Props): JSX.Element | null => {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const response = await fetch(
        `/api/series-progress?titleId=${encodeURIComponent(titleId)}`,
        { credentials: "same-origin", cache: "no-store" }
      );
      if (!response.ok) return;
      const data = (await response.json()) as { progress?: Status };
      if (!cancelled && data.progress) setStatus(data.progress);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  if (!status || status.total === 0) return null;

  return (
    <div className="surface-panel inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/75">
      <span>
        {status.watched}/{status.total} watched
      </span>
      <span className="h-1 w-24 rounded-full bg-white/10">
        <span
          className="block h-1 rounded-full bg-[#f2c46d]"
          style={{ width: `${status.percent}%` }}
        />
      </span>
      <span className="text-white/56">{status.percent}%</span>
    </div>
  );
};
