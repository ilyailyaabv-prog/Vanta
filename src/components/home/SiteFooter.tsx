import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Vanta — SiteFooter Component
 * Clean footer with Vanta-specific links.
 * ───────────────────────────────────────────── */

const footerLinks = {
  Explore: ["Performers", "Collections", "Tags", "Premium"],
  Support: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Support"],
  Company: ["About", "Press", "Cookies"],
};

const footerLinkHrefs: Record<string, string> = {
  Performers: "/performers",
  Collections: "/collections",
  Tags: "/tags",
  Premium: "#",
  "Privacy Policy": "/privacy",
  "Terms of Service": "/terms",
  "Cookie Policy": "/cookies",
  Support: "/support",
  About: "/about",
  Press: "/press",
  Cookies: "/cookies",
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground">
                Vanta
              </span>
              <span className="h-2 w-2 rounded-full bg-copper" />
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A curated video library featuring the world's most talented
              performers and creators.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                {heading}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href={footerLinkHrefs[link] ?? "#"}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border/50 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Vanta. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}