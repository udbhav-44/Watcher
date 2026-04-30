import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusStream",
    short_name: "CampusStream",
    description: "Watch, search, and save titles.",
    start_url: "/",
    display: "standalone",
    background_color: "#070707",
    theme_color: "#070707"
  };
}
