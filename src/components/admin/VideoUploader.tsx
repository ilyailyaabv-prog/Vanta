"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";

const ALLOWED_TYPES = ["video/mp4"];
const MAX_SIZE_MB = 500; // Default, overridden by env on server

interface UploadVideoResponse {
  url: string;
  mediaAsset: {
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    publicUrl: string;
    createdAt: string;
  };
}

interface VideoUploaderProps {
  videoId: string;
  currentVideoUrl: string | null;
  currentFileName: string | null;
  onVideoChange: (url: string | null, fileName: string | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

export function VideoUploader({
  videoId,
  currentVideoUrl,
  currentFileName,
  onVideoChange,
}: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(currentVideoUrl);
  const [fileName, setFileName] = useState<string | null>(currentFileName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type — MP4 only
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Invalid file type. Only MP4 video files are allowed.");
        return;
      }

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("videoId", videoId);

        // Use XMLHttpRequest for upload progress tracking
        const xhr = new XMLHttpRequest();

        const result = await new Promise<UploadVideoResponse>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round(
                (event.loaded / event.total) * 100,
              );
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch {
                reject(new Error("Invalid response from server"));
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText);
                reject(new Error(data.error || "Failed to upload video"));
              } catch {
                reject(new Error("Failed to upload video"));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.open("POST", "/api/admin/media/upload-video");
          xhr.send(formData);
        });

        setVideoUrl(result.url);
        setFileName(result.mediaAsset.fileName);
        onVideoChange(result.url, result.mediaAsset.fileName);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload video",
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [videoId, onVideoChange],
  );

  const handleDelete = useCallback(async () => {
    if (!videoUrl) return;

    if (!window.confirm("Are you sure you want to delete this video file?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      // Fetch the media assets for this video to find the VIDEO_SOURCE asset
      const assetsRes = await fetch(`/api/admin/videos/${videoId}/media`);
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        const videoSourceAsset = assetsData.mediaAssets?.find(
          (asset: any) => asset.assetType === "VIDEO_SOURCE",
        );
        if (videoSourceAsset) {
          const deleteRes = await fetch(
            `/api/admin/media/${videoSourceAsset.id}`,
            { method: "DELETE" },
          );
          if (!deleteRes.ok) {
            const data = await deleteRes.json();
            throw new Error(data.error || "Failed to delete video file");
          }
        }
      }

      setVideoUrl(null);
      setFileName(null);
      onVideoChange(null, null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete video file",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [videoUrl, videoId, onVideoChange]);

  const handleReplacement = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Video File
      </h2>

      {/* Preview / Status */}
      {videoUrl ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-border">
          <video
            src={videoUrl}
            controls
            className="aspect-video w-full bg-black"
            preload="metadata"
          >
            Your browser does not support the video element.
          </video>
          {fileName && (
            <div className="border-t border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
              {fileName}
            </div>
          )}
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-muted-foreground">
              No video file uploaded
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-copper transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
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
        accept=".mp4,video/mp4"
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
          disabled={isUploading || isDeleting}
        >
          {isUploading
            ? "Uploading..."
            : videoUrl
              ? "Replace Video"
              : "Upload Video"}
        </Button>

        {videoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={handleDelete}
            disabled={isDeleting || isUploading}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Accepted format: MP4 only. Max size is configurable via environment.
      </p>
    </div>
  );
}