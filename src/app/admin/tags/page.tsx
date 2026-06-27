import { TagsManagementClient } from "./TagsManagementClient";

export const dynamic = "force-dynamic";

export default function AdminTagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tags
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage tags, groups, and merge duplicates.
        </p>
      </div>
      <TagsManagementClient />
    </div>
  );
}