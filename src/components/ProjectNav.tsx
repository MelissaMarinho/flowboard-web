"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import ExportCsvButton from "./ExportCsvButton";
import AIPrioritizeButton from "./AIPrioritizeButton";
import AISummaryPanel from "./AISummaryPanel";

type Tab = { href: string; label: string };

export default function ProjectNav({
  projectId,
  projectName,
  projectKey,
  initialSummary = null,
  initialSummaryAt = null,
}: {
  projectId: string;
  projectName: string;
  projectKey?: string | null;
  initialSummary?: string | null;
  initialSummaryAt?: string | null;
}) {
  const pathname = usePathname();
  const base = `/dashboard/projects/${projectId}`;

  const tabs: Tab[] = [
    { href: base, label: "Board" },
    { href: `${base}/list`, label: "List" },
    { href: `${base}/sprints`, label: "Sprints" },
    { href: `${base}/calendar`, label: "Calendar" },
    { href: `${base}/gantt`, label: "Gantt" },
    { href: `${base}/analytics`, label: "Analytics" },
    { href: `${base}/activity`, label: "Activity" },
  ];

  function isActive(tab: Tab) {
    // Board is active only on the exact path; others use startsWith
    return tab.href === base ? pathname === base : pathname.startsWith(tab.href);
  }

  return (
    <div className="mb-6">
      {/* Row 1: breadcrumb + project identity */}
      <div className="flex items-center gap-2.5 pb-3">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Projects
        </Link>
        <span className="text-gray-300 dark:text-gray-700 text-sm select-none">/</span>
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
          {projectName}
        </h1>
        {projectKey && (
          <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {projectKey}
          </span>
        )}
      </div>

      {/* Row 2: tab bar + actions */}
      <div className="flex items-end border-b border-gray-200 dark:border-gray-700">
        {/* View tabs — overflow scroll on small screens */}
        <div className="flex min-w-0 flex-1 items-end overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-shrink-0 whitespace-nowrap border-b-2 px-3.5 pb-2.5 pt-0 text-sm font-medium transition-colors -mb-px",
                isActive(tab)
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 mb-2 h-4 w-px flex-shrink-0 bg-gray-200 dark:bg-gray-700" />

        {/* Action buttons */}
        <div className="mb-1.5 flex flex-shrink-0 items-center gap-1.5">
          <Link
            href={`${base}/chat`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              pathname.startsWith(`${base}/chat`)
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-950"
            )}
          >
            <span>AI Chat</span>
          </Link>
          <ExportCsvButton projectId={projectId} projectName={projectName} compact />
          <AIPrioritizeButton projectId={projectId} compact />
          <AISummaryPanel
            projectId={projectId}
            initialSummary={initialSummary}
            initialSummaryAt={initialSummaryAt}
          />
        </div>
      </div>
    </div>
  );
}
