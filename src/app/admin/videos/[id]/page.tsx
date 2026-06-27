"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ThumbnailUploader } from "@/components/admin/ThumbnailUploader";
import { VideoUploader } from "@/components/admin/VideoUploader";

interface VideoData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  accessLevel: string;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  commentCount: number;
  durationSeconds: number;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { videoModels: number; videoTags: number };
  videoModels: { model: { id: string; name: string; slug: string } }[];
  videoTags: { tag: { id: string; name: string; slug: string } }[];
  uploader: { email: string; profile: { username: string } | null } | null;
}

interface PerformerOption {
  id: string;
  name: string;
  slug: string;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

const STATUS_BADGE_VARIANTS: Record<string, "copper" | "gray" | "green" | "warning"> = {
  published: "green",
  draft: "gray",
  processing: "warning",
  archived: "gray",
  rejected: "warning",
};

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [accessLevel, setAccessLevel] = useState("public");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedPerformerIds, setSelectedPerformerIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);

  // Data for selects
  const [performers, setPerformers] = useState<PerformerOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/performers?limit=500").then((res) => res.json()),
      fetch("/api/admin/tags?limit=500").then((res) => res.json()),
    ])
      .then(([performersData, tagsData]) => {
        setPerformers(performersData.performers || []);
        setTags(tagsData.tags || []);
      })
      .catch(() => {});
  }, []);

  const fetchVideo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/videos/${id}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      const data = await res.json();
      const v = data.video as VideoData;
      setVideo(v);
      setTitle(v.title);
      setSlug(v.slug);
      setDescription(v.description ?? "");
      setStatus(v.status);
      setAccessLevel(v.accessLevel);
      setIsFeatured(v.isFeatured);
      setSelectedPerformerIds(v.videoModels.map((vm) => vm.model.id));
      setSelectedTagIds(v.videoTags.map((vt) => vt.tag.id));
      setThumbnailUrl(v.thumbnailUrl);
      // Fetch the video source URL from media assets
      fetch(`/api/admin/videos/${id}/media`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.mediaAssets) {
            const videoSource = data.mediaAssets.find(
              (a: any) => a.assetType === "VIDEO_SOURCE"
            );
            if (videoSource) {
              // We need to derive the public URL from the storage key
              // The media endpoint should return a publicUrl
              if (videoSource.publicUrl) {
                setVideoUrl(videoSource.publicUrl);
                setVideoFileName(videoSource.fileName);
              }
            }
          }
        })
        .catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const togglePerformerId = (performerId: string) => {
    setSelectedPerformerIds((prev) =>
      prev.includes(performerId)
        ? prev.filter((p) => p !== performerId)
        : [...prev, performerId],
    );
  };

  const toggleTagId = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const body: Record<string, any> = {
        title,
        slug,
        description: description || null,
        status,
        accessLevel,
        isFeatured,
        performerIds: selectedPerformerIds,
        tagIds: selectedTagIds,
      };

      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update video");
      }

      setSuccess("Video updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    const action = status === "published" ? "unpublish" : "publish";
    const label = action === "publish" ? "publish" : "unpublish";

    if (!window.confirm(`Are you sure you want to ${label} this video?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${label} video`);
      }

      fetchVideo();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${label} video`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete video");
      }

      router.push("/admin/videos");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete video");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-copper border-t-transparent" />
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Edit Video
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update video metadata and settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE_VARIANTS[status] || "gray"} size="md">
            {status}
          </Badge>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Error message */}
      {error && video && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats bar */}
      {video && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card px-5 py-3 text-sm">
          <div>
            <span className="text-muted-foreground">Views: </span>
            <span className="font-medium text-foreground">{video.viewCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Likes: </span>
            <span className="font-medium text-foreground">{video.likeCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Comments: </span>
            <span className="font-medium text-foreground">{video.commentCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Favorites: </span>
            <span className="font-medium text-foreground">{video.favoriteCount.toLocaleString()}</span>
          </div>
          {video.uploader && (
            <div>
              <span className="text-muted-foreground">Uploader: </span>
              <span className="font-medium text-foreground">
                {video.uploader.profile?.username ?? video.uploader.email}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Video file upload */}
      <VideoUploader
        videoId={id}
        currentVideoUrl={videoUrl}
        currentFileName={videoFileName}
        onVideoChange={(url, fileName) => {
          setVideoUrl(url);
          setVideoFileName(fileName);
        }}
      />

      {/* Thumbnail upload */}
      <ThumbnailUploader
        videoId={id}
        currentThumbnailUrl={thumbnailUrl}
        onThumbnailChange={setThumbnailUrl}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic information */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Slug
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="h-24 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20"
              />
            </div>
          </div>
        </div>

        {/* Performers */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Performers
          </h2>
          {performers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No performers available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {performers.map((performer) => {
                const isSelected = selectedPerformerIds.includes(performer.id);
                return (
                  <button
                    key={performer.id}
                    type="button"
                    onClick={() => togglePerformerId(performer.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "border-copper bg-copper/10 text-copper-light"
                        : "border-border bg-secondary text-muted-foreground hover:border-copper/30 hover:text-foreground"
                    }`}
                  >
                    {performer.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Tags
          </h2>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTagId(tag.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "border-copper bg-copper/10 text-copper-light"
                        : "border-border bg-secondary text-muted-foreground hover:border-copper/30 hover:text-foreground"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Settings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-secondary px-3 text-sm text-foreground focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20"
              >
                <option value="draft">Draft</option>
                <option value="processing">Processing</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-secondary px-3 text-sm text-foreground focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-secondary text-copper focus:ring-copper"
              />
              <span className="text-sm text-foreground">Featured video</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={handleDelete}
            >
              Delete Video
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTogglePublish}
            >
              {status === "published" ? "Unpublish" : "Publish"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/admin/videos")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}