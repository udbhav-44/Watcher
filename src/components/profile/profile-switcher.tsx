"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Profile = {
  key: string;
  displayName: string;
};

export const ProfileSwitcher = (): JSX.Element => {
  const [profileKey, setProfileKey] = useState("guest");
  const [profiles, setProfiles] = useState<Profile[]>([
    { key: "guest", displayName: "Guest" }
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile", { credentials: "same-origin" }).then((res) =>
        res.json()
      ),
      fetch("/api/profiles", { credentials: "same-origin" }).then((res) =>
        res.json()
      )
    ])
      .then(
        ([active, all]: [
          { profileKey?: string },
          { profiles?: Profile[] }
        ]) => {
          setProfileKey(active.profileKey ?? "guest");
          setProfiles(
            all.profiles?.length
              ? all.profiles
              : [{ key: "guest", displayName: "Guest" }]
          );
        }
      )
      .catch(() => setProfiles([{ key: "guest", displayName: "Guest" }]));
  }, []);

  const selectProfile = (nextKey: string): void => {
    setProfileKey(nextKey);
    void fetch("/api/profile", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileKey: nextKey })
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-white/56">Profile</span>
      {profiles.map((profile) => (
        <Button
          key={profile.key}
          variant={profileKey === profile.key ? "primary" : "ghost"}
          size="sm"
          onClick={() => selectProfile(profile.key)}
        >
          {profile.displayName}
        </Button>
      ))}
    </div>
  );
};
