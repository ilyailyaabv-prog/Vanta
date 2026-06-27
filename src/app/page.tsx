/* ─────────────────────────────────────────────
 * Vanta — Root Page
 * Redirects to the public homepage.
 * ───────────────────────────────────────────── */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/home");
}