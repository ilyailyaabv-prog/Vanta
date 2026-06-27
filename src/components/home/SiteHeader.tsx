"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

/* ─────────────────────────────────────────────
 * Vanta — SiteHeader Component
 * Sticky glass header with logo, nav links,
 * search, actions. Performer-centered.
 * ───────────────────────────────────────────── */

/* ── SVG Icons ── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const navLinks = [
  { label: "Performers", href: "/performers" },
  { label: "Collections", href: "/collections" },
  { label: "Tags", href: "/tags" },
];

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchValue.trim())}`;
    }
    setSearchOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/50",
        "glass",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Vanta
          </span>
          <span className="h-2 w-2 rounded-full bg-copper" />
        </a>

        {/* Nav links — desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Search */}
        <div
          className={cn(
            "flex-1 md:max-w-md lg:max-w-lg",
            searchOpen
              ? "absolute inset-x-4 top-4 z-50 md:relative md:inset-auto md:top-auto"
              : "hidden md:block",
          )}
        >
          <form onSubmit={handleSearch} className="w-full">
            <Input
              placeholder="Search performers, tags, collections..."
              icon={<SearchIcon />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              wrapperClassName="w-full"
            />
          </form>
        </div>

        {/* Spacer */}
        <div className="hidden flex-1 md:block" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl md:hidden",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              "transition-colors",
              searchOpen && "hidden",
            )}
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          {/* Close search (mobile) */}
          {searchOpen && (
            <button
              type="button"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl md:hidden",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                "transition-colors",
              )}
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}

          {/* User avatar */}
          <button
            type="button"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-secondary text-secondary-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors",
            )}
            aria-label="User menu"
          >
            <UserIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}