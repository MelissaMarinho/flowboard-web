"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "next-auth";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/my-tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  user,
  workspaces = [],
  overdueCount = 0,
}: {
  user: User;
  workspaces?: Workspace[];
  overdueCount?: number;
}) {
  const pathname = usePathname();
  const [wsOpen, setWsOpen] = useState(false);

  return (
    <aside className="relative flex h-screen w-60 flex-col border-r border-gray-200 bg-white px-4 py-6 dark:border-gray-700 dark:bg-gray-900">
      {/* Logo */}
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-lg font-bold text-indigo-600">FlowBoard</span>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      {/* Workspace switcher */}
      <div className="relative mb-6">
        <button
          onClick={() => setWsOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="truncate font-medium">
              {workspaces.length > 0 ? workspaces[0].name : "No workspace"}
            </span>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${wsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {wsOpen && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {workspaces.map((w) => (
              <Link
                key={w.id}
                href="/dashboard/projects"
                onClick={() => setWsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <span className="truncate">{w.name}</span>
              </Link>
            ))}
            <div className="mt-1 border-t border-gray-100 pt-1 dark:border-gray-700">
              <Link
                href="/dashboard/projects"
                onClick={() => setWsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New workspace
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {label === "Projects" && overdueCount > 0 && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                {overdueCount > 9 ? "9+" : overdueCount}
              </span>
            )}
          </Link>
        ))}

        {/* Search hint */}
        <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-400 dark:text-gray-600">
          <Search className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1 truncate">Search tasks…</span>
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            ⌘K
          </kbd>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex items-center gap-3 px-2 py-2">
          {user.image ? (
            <img src={user.image} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
