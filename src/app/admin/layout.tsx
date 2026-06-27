import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/auth-helpers";
import { AdminShell } from "./AdminShell";

/* ─────────────────────────────────────────────
 * Vanta — Admin Layout
 * Auth-awareness layout.
 * - If authenticated: wraps children in AdminShell (sidebar, header)
 * - If not authenticated: renders children as-is (login page)
 * - Auth redirects are handled by middleware.ts
 * ───────────────────────────────────────────── */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If authenticated with admin access, use the AdminShell
  if (session?.user && canAccessAdmin(session.user.role)) {
    return (
      <AdminShell user={session.user}>
        {children}
      </AdminShell>
    );
  }

  // Otherwise render without shell (login page, etc.)
  return <>{children}</>;
}