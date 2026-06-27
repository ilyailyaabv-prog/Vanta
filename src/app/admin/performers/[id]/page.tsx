"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PerformerData {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  countryCode: string | null;
  heightCm: number | null;
  measurements: string | null;
  ethnicity: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  isActive: boolean;
  isVerified: boolean;
  _count: { videoModels: number };
  aliases: { alias: string }[];
}

export default function EditPerformerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [performer, setPerformer] = useState<PerformerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const fetchPerformer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/performers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch performer");
      const data = await res.json();
      const p = data.performer as PerformerData;
      setPerformer(p);
      setName(p.name);
      setSlug(p.slug);
      setBio(p.bio ?? "");
      setGender(p.gender ?? "");
      setEthnicity(p.ethnicity ?? "");
      setHairColor(p.hairColor ?? "");
      setEyeColor(p.eyeColor ?? "");
      setCountryCode(p.countryCode ?? "");
      setHeightCm(p.heightCm ? String(p.heightCm) : "");
      setMeasurements(p.measurements ?? "");
      setIsActive(p.isActive);
      setIsVerified(p.isVerified);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPerformer();
  }, [fetchPerformer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const body: Record<string, any> = {
        name,
        slug,
        bio: bio || null,
        gender: gender || null,
        ethnicity: ethnicity || null,
        hairColor: hairColor || null,
        eyeColor: eyeColor || null,
        countryCode: countryCode?.toUpperCase() || null,
        heightCm: heightCm ? parseInt(heightCm, 10) : null,
        measurements: measurements || null,
        isActive,
        isVerified,
      };

      const res = await fetch(`/api/admin/performers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update performer");
      }

      setSuccess("Performer updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-copper border-t-transparent" />
      </div>
    );
  }

  if (error && !performer) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Edit Performer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update performer profile and details.
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Error message */}
      {error && performer && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
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
                Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                Biography
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="h-24 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20"
              />
            </div>
          </div>
        </div>

        {/* Personal details */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Personal Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Gender
              </label>
              <Input
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="e.g. female, male"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Ethnicity
              </label>
              <Input
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Hair Color
              </label>
              <Input
                value={hairColor}
                onChange={(e) => setHairColor(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Eye Color
              </label>
              <Input
                value={eyeColor}
                onChange={(e) => setEyeColor(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Country Code
              </label>
              <Input
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                placeholder="e.g. US"
                maxLength={2}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Height (cm)
              </label>
              <Input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 170"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Measurements
              </label>
              <Input
                value={measurements}
                onChange={(e) => setMeasurements(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Status
          </h2>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-secondary text-copper focus:ring-copper"
              />
              <span className="text-sm text-foreground">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-secondary text-copper focus:ring-copper"
              />
              <span className="text-sm text-foreground">Verified</span>
            </label>
          </div>
          {performer && (
            <p className="mt-3 text-xs text-muted-foreground">
              {performer._count.videoModels} video(s) associated with this
              performer.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/performers")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}