import { AdminCollectionsClient } from "./AdminCollectionsClient";

export const dynamic = "force-dynamic";

export default function AdminCollectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Collections
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated collections of videos and performers.
        </p>
      </div>
      <AdminCollectionsClient />
    </div>
  );
}