import { MediaLibraryClient } from "./MediaLibraryClient";

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Media Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse, search, and manage uploaded media assets.
        </p>
      </div>
      <MediaLibraryClient />
    </div>
  );
}