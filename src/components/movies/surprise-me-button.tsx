"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { detailHrefFor } from "@/lib/catalog/titleId";

export const SurpriseMeButton = (): JSX.Element => {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const surprise = async (): Promise<void> => {
    setBusy(true);
    const response = await fetch("/api/surprise-me", {
      credentials: "same-origin",
      cache: "no-store"
    });
    setBusy(false);
    if (!response.ok) {
      toast.error("Couldn't pick a title right now");
      return;
    }
    const data = (await response.json()) as { pick?: { titleId: string; title: string } };
    if (!data.pick) {
      toast.info("No surprise available, try again");
      return;
    }
    toast.success(`How about “${data.pick.title}”?`);
    router.push(detailHrefFor(data.pick.titleId));
  };

  return (
    <Button type="button" variant="outline" size="lg" onClick={surprise} disabled={busy}>
      <Sparkles className="mr-2 h-4 w-4" />
      Surprise me
    </Button>
  );
};
