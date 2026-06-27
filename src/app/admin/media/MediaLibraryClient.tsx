"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface MediaItem {
  id: string;
  assetType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  width: number | null;
  height: number | null;
  createdAt: string;
  video: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function MediaLibraryClient() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (assetType) params.set("assetType", assetType);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      setMedia(data.media ?? []);
    } catch {
      setError("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [search, assetType]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media asset? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      setSuccess("Media asset deleted");
      fetchMedia();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const orphanCount = media.filter((m) => !m.video).length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">{success}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="THUMBNAIL">Thumbnails</option>
          <option value="VIDEO_SOURCE">Source Videos</option>
          <option value="PREVIEW">Previews</option>
          <option value="HLS_PLAYLIST">HLS Playlists</option>
          <option value="HLS_SEGMENT">HLS Segments</option>
        </select>
        {orphanCount > 0 && (
          <Badge variant="warning">{orphanCount} orphaned</Badge>
        )}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading media...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">No media assets found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-sidebar-accent">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">File</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Size</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Dimensions</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Linked Video</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Uploaded</th>
                <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {media.map((item) => (
                <tr key={item.id} className="hover:bg-sidebar-accent/50">
                  <td className="px-4 py-3 text-foreground max-w-[200px] truncate" title={item.fileName}>
                    {item.fileName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="gray">{item.assetType.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatFileSize(Number(item.fileSize))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.width && item.height ? `${item.width}x${item.height}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {item.video ? (
                      <span className="text-foreground">{item.video.title}</span>
                    ) : (
                      <Badge variant="warning">Orphan</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}