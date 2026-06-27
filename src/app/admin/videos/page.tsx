"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface VideoListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  accessLevel: string;
  isFeatured: boolean;
  viewCount: number;
  performerCount: number;
  tagCount: number;
  performers: { id: string; name: string; slug: string }[];
  publishedAt: string | null;
  createdAt: string;
}

interface PerformerOption {
  id: string;
  name: string;
}

function AddIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

const STATUS_BADGE_VARIANTS: Record<string, "copper" | "gray" | "green" | "warning"> = {
  published: "green",
  draft: "gray",
  processing: "warning",
  archived: "gray",
  rejected: "warning",
};

export default function AdminVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [performerFilter, setPerformerFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [performers, setPerformers] = useState<PerformerOption[]>([]);

  // Fetch performers for filter dropdown
  useEffect(() => {
    fetch("/api/admin/performers?limit=200")
      .then((res) => res.json())
      .then((data) => setPerformers(data.performers || []))
      .catch(() => {});
  }, []);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (performerFilter) params.set("performerId", performerFilter);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/videos?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await res.json();
      setVideos(data.videos);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, performerFilter, page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, performerFilter]);

  const handleDelete = async (id: string, title: string) => {
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

      fetchVideos();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete video");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    const action = currentStatus === "published" ? "unpublish" : "publish";
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

      fetchVideos();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${label} video`);
    }
  };

  const columns: Column<VideoListItem>[] = [
    {
      key: "title",
      header: "Title",
      render: (v) => (
        <Link
          href={`/admin/videos/${v.id}`}
          className="font-medium text-copper hover:text-copper-light"
        >
          {v.title}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (v) => (
        <Badge variant={STATUS_BADGE_VARIANTS[v.status] || "gray"} size="sm">
          {v.status}
        </Badge>
      ),
    },
    {
      key: "performers",
      header: "Performers",
      render: (v) => (
        <span className="text-sm text-muted-foreground">
          {v.performers.length > 0
            ? v.performers.map((p) => p.name).join(", ")
            : "—"}
        </span>
      ),
    },
    {
      key: "accessLevel",
      header: "Access",
      render: (v) => (
        <span className="text-xs text-muted-foreground capitalize">
          {v.accessLevel}
        </span>
      ),
    },
    {
      key: "viewCount",
      header: "Views",
      render: (v) => (
        <span className="text-sm">{v.viewCount.toLocaleString()}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (v) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTogglePublish(v.id, v.status)}
          >
            {v.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/videos/${v.id}`)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={() => handleDelete(v.id, v.title)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Videos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage video content, metadata, and publishing status.
          </p>
        </div>
        <Link href="/admin/videos/create">
          <Button>
            <AddIcon className="mr-1.5" />
            Add Video
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1 sm:min-w-[240px]">
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon />}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="processing">Processing</option>
          <option value="archived">Archived</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={performerFilter}
          onChange={(e) => setPerformerFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20"
        >
          <option value="">All Performers</option>
          {performers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Data table */}
      <DataTable
        columns={columns}
        data={videos}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No videos found. Create your first video to get started."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}