import { getAllPerformers } from "@/server/queries";
import { PerformersIndexClient } from "./PerformersIndexClient";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
 * Vanta — Performers Index Page (Server)
 * Fetches data and passes to client component.
 * ───────────────────────────────────────────── */

export default async function PerformersIndexPage() {
  const performers = await getAllPerformers();
  return <PerformersIndexClient initialPerformers={performers} />;
}