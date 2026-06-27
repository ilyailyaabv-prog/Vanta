export const dynamic = "force-dynamic";

import { getAllVideos, getAllPerformers, getAllTags } from "@/server/queries";
import { SearchClient } from "./SearchClient";

export default async function SearchPage() {
  const [initialAllVideos, initialPerformers, initialAllTags] = await Promise.all([
    getAllVideos(),
    getAllPerformers(),
    getAllTags(),
  ]);

  const tagNameList = initialAllTags.map((t) => ({
    name: t.name,
    slug: t.slug,
    videoCount: t.videoCount,
    performerCount: t.performerCount,
  }));

  return (
    <SearchClient
      initialAllVideos={initialAllVideos}
      initialPerformers={initialPerformers}
      initialAllTags={tagNameList}
    />
  );
}