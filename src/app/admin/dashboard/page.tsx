import { Card } from "@/components/ui/card";

const tiles = [
  { title: "Ingest Jobs", value: "12 Today", hint: "2 pending validation" },
  { title: "Broken Links", value: "3", hint: "Needs moderation review" },
  { title: "Metadata Mismatches", value: "7", hint: "Auto-detected in nightly sync" },
  { title: "Featured Rails", value: "9 active", hint: "Curated by media team" }
];

export default function AdminDashboardPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.title} className="space-y-2">
            <p className="text-sm text-white/60">{tile.title}</p>
            <p className="text-2xl font-semibold">{tile.value}</p>
            <p className="text-xs text-white/50">{tile.hint}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
