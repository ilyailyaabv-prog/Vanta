"use client";

import { cn } from "@/lib/utils";

/* ── SVG Icons ── */

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ── TopNav Component ── */

interface AdminTopNavProps {
  onMenuClick: () => void;
  user?: {
    name?: string | null;
    email: string;
    role: string;
  };
}

export function AdminTopNav({ onMenuClick, user }: AdminTopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <MenuIcon />
      </button>

      {/* Search bar */}
      <div className="relative flex-1 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search..."
          className={cn(
            "h-9 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm",
            "text-foreground placeholder:text-muted-foreground",
            "focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper",
            "transition-colors",
          )}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <button
        type="button"
        className="relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <BellIcon />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-copper" />
      </button>

      {/* Admin avatar */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-copper text-xs font-bold text-copper-foreground">
          {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <span className="text-sm font-medium text-foreground">
            {user?.name ?? "Admin"}
          </span>
          <ChevronDownIcon className="text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}