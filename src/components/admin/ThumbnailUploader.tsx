"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface ThumbnailUploaderProps {
  videoId: string;
  currentThumbnailUrl: string | null;
  onThumbnailChange: (url: string | null) => void;
}

export function ThumbnailUploader({
  videoId,
  currentThumbnailUrl,
  onThumbnailChange,
}: ThumbnailUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentThumbnailUrl,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Invalid file type. Allowed: jpg, jpeg, png, webp.");
        return;
      }

      // Validate file size
      if (file.size > MAX_SIZE) {
        setError("File too large. Maximum size is 5 MB.");
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("videoId", videoId);

        const res = await fetch("/api/admin/media/upload-thumbnail", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload thumbnail");
        }

        const result = await res.json();
        setPreviewUrl(result.url);
        onThumbnailChange(result.url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload thumbnail",
        );
      } finally {
        setIsUploading(false);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [videoId, onThumbnailChange],
  );

  const handleDelete = useCallback(async () => {
    if (!previewUrl) return;

    if (!window.confirm("Are you sure you want to delete this thumbnail?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      // First, fetch the media assets for this video to find the thumbnail asset ID
      // We need to find the media asset by its public URL
      const assetsRes = await fetch(`/api/admin/videos/${videoId}/media`);
      // If that endpoint doesn't exist, we fall back to just clearing the thumbnail
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        const thumbnailAsset = assetsData.mediaAssets?.find(
          (asset: any) => asset.assetType === "THUMBNAIL",
        );
        if (thumbnailAsset) {
          const deleteRes = await fetch(
            `/api/admin/media/${thumbnailAsset.id}`,
            { method: "DELETE" },
          );
          if (!deleteRes.ok) {
            const data = await deleteRes.json();
            throw new Error(data.error || "Failed to delete thumbnail");
          }
        }
      }

      setPreviewUrl(null);
      onThumbnailChange(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete thumbnail",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [previewUrl, videoId, onThumbnailChange]);

  const handleReplacement = useCallback(() => {
    // Trigger the file input to pick a new file
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Thumbnail
      </h2>

      {/* Preview */}
      {previewUrl ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-border">
          <img
            src={previewUrl}
            alt="Video thumbnail"
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-4 flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-secondary">
          <div className="text-center">
            <svg
              className="mx-auto h-10 w-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-muted-foreground">
              No thumbnail uploaded
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleReplacement}
          disabled={isUploading}
        >
          {isUploading
            ? "Uploading..."
            : previewUrl
              ? "Replace Thumbnail"
              : "Upload Thumbnail"}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Accepted formats: JPG, JPEG, PNG, WEBP. Max size: 5 MB.
      </p>
    </div>
  );
}