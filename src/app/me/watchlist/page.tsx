import { redirect } from "next/navigation";

export default function WatchlistRedirectPage(): never {
  redirect("/me/collections/watchlist");
}
