"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PerformerListItem {
  id: string;
  name: string;
  slug: string;
  videoCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function AdminPerformersPage() {
  const router = useRouter();
  const [performers, setPerformers] = useState<PerformerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPerformers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/performers?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch performers");
      }
      const data = await res.json();
      setPerformers(data.performers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPerformers();
  }, [fetchPerformers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const res = await fetch("/api/admin/performers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create performer");
      }

      setShowCreateModal(false);
      setCreateName("");
      fetchPerformers();
      router.refresh();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/performers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete performer");
      }

      fetchPerformers();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete performer");
    }
  };

  const columns: Column<PerformerListItem>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <Link
          href={`/admin/performers/${p.id}`}
          className="font-medium text-copper hover:text-copper-light"
        >
          {p.name}
        </Link>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (p) => (
        <span className="text-muted-foreground">{p.slug}</span>
      ),
    },
    {
      key: "videoCount",
      header: "Videos",
      render: (p) => <span>{p.videoCount}</span>,
    },
    {
      key: "isActive",
      header: "Active",
      render: (p) =>
        p.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            <CheckIcon /> Active
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
            Inactive
          </span>
        ),
    },
    {
      key: "isVerified",
      header: "Verified",
      render: (p) =>
        p.isVerified ? (
          <span className="text-emerald-400">Yes</span>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/performers/${p.id}`)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={() => handleDelete(p.id, p.name)}
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
            Performers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage performers and talent profiles.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <AddIcon className="mr-1.5" />
          Add Performer
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search performers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<SearchIcon />}
        />
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
        data={performers}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No performers found. Create your first performer to get started."
      />

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Create Performer
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {createError}
                </div>
              )}
              <Input
                placeholder="Performer name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}