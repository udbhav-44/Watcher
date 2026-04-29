"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const profileOptions = ["default", "night-owl", "cinema-club"];

export const ProfileSwitcher = (): JSX.Element => {
  const [profileKey, setProfileKey] = useState("default");

  useEffect(() => {
    const saved = window.localStorage.getItem("campus.profile");
    if (saved) setProfileKey(saved);
  }, []);

  const selectProfile = (nextKey: string): void => {
    setProfileKey(nextKey);
    window.localStorage.setItem("campus.profile", nextKey);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {profileOptions.map((option) => (
        <Button
          key={option}
          variant={profileKey === option ? "primary" : "ghost"}
          size="sm"
          onClick={() => selectProfile(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
};
