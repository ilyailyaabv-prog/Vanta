"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface TagGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  tagCount: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagGroupId: string;
  tagGroup: { id: string; name: string } | null;
  isActive: boolean;
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TagFormData {
  name: string;
  slug: string;
  tagGroupId: string;
  description: string;
}

export function TagsManagementClient() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [form, setForm] = useState<TagFormData>({
    name: "",
    slug: "",
    tagGroupId: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/tags?${params}`);
      const data = await res.json();
      setTags(data.tags ?? []);
    } catch {
      setError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchTagGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tag-groups");
      const data = await res.json();
      setTagGroups(data.tagGroups ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchTags();
    fetchTagGroups();
  }, [fetchTags, fetchTagGroups]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const resetForm = () => {
    setForm({ name: "", slug: "", tagGroupId: "", description: "" });
    setShowCreate(false);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    if (!form.name || !form.slug || !form.tagGroupId) {
      setError("Name, slug, and group are required");
      return;
    }
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create tag");
      }
      setSuccess(`Tag "${form.name}" created`);
      resetForm();
      fetchTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/tags/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update tag");
      }
      setSuccess("Tag updated");
      resetForm();
      fetchTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update tag");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete tag");
      }
      setSuccess("Tag deleted");
      fetchTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    }
  };

  const handleEdit = (tag: Tag) => {
    setForm({
      name: tag.name,
      slug: tag.slug,
      tagGroupId: tag.tagGroupId,
      description: tag.description ?? "",
    });
    setEditingId(tag.id);
    setShowCreate(true);
    setError("");
    setSuccess("");
  };

  const handleMerge = async () => {
    if (!mergeSourceId || !mergeTargetId) {
      setError("Select both source and target tags");
      return;
    }
    if (mergeSourceId === mergeTargetId) {
      setError("Cannot merge a tag into itself");
      return;
    }
    if (!confirm("Merge tags? This will move all associations and delete the source tag.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceTagId: mergeSourceId, targetTagId: mergeTargetId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to merge tags");
      }
      setSuccess("Tags merged successfully");
      setMergeSourceId("");
      setMergeTargetId("");
      fetchTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to merge tags");
    }
  };

  return (
    <div className="space-y-6">
      {/* Error / Success */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Search + Create */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(!showCreate); }}>
          {showCreate ? "Cancel" : "Create Tag"}
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit Tag" : "Create Tag"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Tag name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Slug *</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="tag-slug"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Group *</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.tagGroupId}
                onChange={(e) => setForm((p) => ({ ...p, tagGroupId: e.target.value }))}
              >
                <option value="">Select group...</option>
                {tagGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={editingId ? handleUpdate : handleCreate}>
              {editingId ? "Update" : "Create"}
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Merge Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Merge Duplicate Tags</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Source Tag (will be deleted)</label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={mergeSourceId}
              onChange={(e) => setMergeSourceId(e.target.value)}
            >
              <option value="">Select source...</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.videoCount} videos)
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Target Tag (will keep)</label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
            >
              <option value="">Select target...</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.videoCount} videos)
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleMerge} variant="secondary">
            Merge
          </Button>
        </div>
      </div>

      {/* Tags Table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading tags...</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">No tags found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-sidebar-accent">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Group</th>
                <th className="px-4 py-3 text-center font-medium text-foreground">Videos</th>
                <th className="px-4 py-3 text-center font-medium text-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-sidebar-accent/50">
                  <td className="px-4 py-3 text-foreground">{tag.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tag.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant="gray">{tag.tagGroup?.name ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {tag.videoCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={tag.isActive ? "copper" : "gray"}>
                      {tag.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(tag.id)}
                      >
                        Delete
                      </Button>
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