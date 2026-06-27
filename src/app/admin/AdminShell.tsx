"use client";

import { useState, useCallback } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import type { UserRole } from "@prisma/client";

interface AdminShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name?: string | null;
    email: string;
    role: UserRole;
  };
}

export function AdminShell({ children, user }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} onClose={closeSidebar} user={user} />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopNav onMenuClick={openSidebar} user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}