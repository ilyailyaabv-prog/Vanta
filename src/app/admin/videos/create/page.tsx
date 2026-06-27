"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThumbnailUploader } from "@/components/admin/ThumbnailUploader";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function CreateVideoPage() {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [accessLevel, setAccessLevel] = useState("public");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedPerformerIds, setSelectedPerformerIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

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

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  };

  const togglePerformerId = (id: string) => {
    setSelectedPerformerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const toggleTagId = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const body = {
        title,
        slug: slug || undefined,
        description: description || null,
        status,
        accessLevel,
        isFeatured,
        performerIds: selectedPerformerIds,
        tagIds: selectedTagIds,
      };

      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create video");
      }

      const result = await res.json();
      setCreatedVideoId(result.video.id);
      setThumbnailUrl(result.video.thumbnailUrl || null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Create Video
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new video entry to the catalog.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Thumbnail upload - shown after video is created */}
      {createdVideoId && (
        <ThumbnailUploader
          videoId={createdVideoId}
          currentThumbnailUrl={thumbnailUrl}
          onThumbnailChange={setThumbnailUrl}
        />
      )}

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
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="Enter video title"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Slug
              </label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                placeholder="auto-generated from title"
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
                placeholder="Enter video description"
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
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="h-10 w-full rounded-xl border border-border bg-secondary px-3 text-sm text-foreground focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
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
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/videos")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Creating..." : "Create Video"}
          </Button>
        </div>
      </form>

      {/* Navigation after creation */}
      {createdVideoId && (
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/admin/videos/${createdVideoId}`)}
          >
            Edit Video Details
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/admin/videos")}
          >
            Back to Videos
          </Button>
        </div>
      )}
    </div>
  );
}