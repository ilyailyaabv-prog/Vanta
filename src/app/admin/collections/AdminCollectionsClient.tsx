"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  videoCount: number;
  performerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CollectionForm {
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
}

export function AdminCollectionsClient() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionForm>({
    title: "",
    slug: "",
    description: "",
    coverImageUrl: "",
    sortOrder: 0,
    isFeatured: false,
    isPublished: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/collections?${params}`);
      const data = await res.json();
      setCollections(data.collections ?? []);
    } catch {
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editingId ? prev.slug : generateSlug(title),
    }));
  };

  const resetForm = () => {
    setForm({ title: "", slug: "", description: "", coverImageUrl: "", sortOrder: 0, isFeatured: false, isPublished: false });
    setShowCreate(false);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    if (!form.title || !form.slug) {
      setError("Title and slug are required");
      return;
    }
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create collection");
      }
      setSuccess(`Collection "${form.title}" created`);
      resetForm();
      fetchCollections();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/collections/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update collection");
      }
      setSuccess("Collection updated");
      resetForm();
      fetchCollections();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update collection");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete collection");
      }
      setSuccess("Collection deleted");
      fetchCollections();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete collection");
    }
  };

  const handleEdit = (c: Collection) => {
    setForm({
      title: c.title,
      slug: c.slug,
      description: c.description ?? "",
      coverImageUrl: c.coverImageUrl ?? "",
      sortOrder: c.sortOrder,
      isFeatured: c.isFeatured,
      isPublished: c.isPublished,
    });
    setEditingId(c.id);
    setShowCreate(true);
    setError("");
    setSuccess("");
  };

  const togglePublish = async (c: Collection) => {
    try {
      const res = await fetch(`/api/admin/collections/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !c.isPublished }),
      });
      if (res.ok) {
        setSuccess(c.isPublished ? "Collection unpublished" : "Collection published");
        fetchCollections();
      }
    } catch {
      setError("Failed to toggle publish status");
    }
  };

  const toggleFeatured = async (c: Collection) => {
    try {
      const res = await fetch(`/api/admin/collections/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !c.isFeatured }),
      });
      if (res.ok) {
        setSuccess(c.isFeatured ? "Unfeatured" : "Featured");
        fetchCollections();
      }
    } catch {
      setError("Failed to toggle featured status");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">{success}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search collections..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(!showCreate); }}>
          {showCreate ? "Cancel" : "Create Collection"}
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit Collection" : "Create Collection"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Title *</label>
              <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Collection title" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Slug *</label>
              <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="collection-slug" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-muted-foreground">Description</label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cover Image URL</label>
              <Input value={form.coverImageUrl} onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Sort Order</label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
                Published
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={editingId ? handleUpdate : handleCreate}>
              {editingId ? "Update" : "Create"}
            </Button>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">No collections found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-sidebar-accent">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Slug</th>
                <th className="px-4 py-3 text-center font-medium text-foreground">Videos</th>
                <th className="px-4 py-3 text-center font-medium text-foreground">Performers</th>
                <th className="px-4 py-3 text-center font-medium text-foreground">Published</th>
                <th className="px-4 py-3 text-center font-medium text-foreground">Featured</th>
                <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-sidebar-accent/50">
                  <td className="px-4 py-3 text-foreground font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{c.videoCount}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{c.performerCount}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => togglePublish(c)} className="cursor-pointer">
                      <Badge variant={c.isPublished ? "green" : "gray"}>{c.isPublished ? "Yes" : "No"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleFeatured(c)} className="cursor-pointer">
                      <Badge variant={c.isFeatured ? "copper" : "gray"}>{c.isFeatured ? "Yes" : "No"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(c.id)}>Delete</Button>
                    </div>
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