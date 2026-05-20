"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  number: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  projectId: string;
  projectName: string;
  projectKey: string | null;
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-400",
  MEDIUM: "bg-amber-400",
  LOW: "bg-gray-300",
};

// Inner dialog — mounts fresh each time so no reset useEffect needed
function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search — all setState calls inside inner async function
  useEffect(() => {
    let cancelled = false;
    async function doSearch() {
      if (!query.trim()) {
        if (!cancelled) setResults([]);
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok && !cancelled) {
          const data: unknown = await res.json();
          if (Array.isArray(data)) {
            setResults(data as SearchResult[]);
            setSelectedIdx(0);
          }
        }
      } catch {
        // silently ignore
      }
      if (!cancelled) setLoading(false);
    }
    const id = setTimeout(() => {
      doSearch().catch(() => {});
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  function navigate(result: SearchResult) {
    router.push(`/dashboard/projects/${result.projectId}/tasks/${result.id}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      navigate(results[selectedIdx]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[14vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks across all projects…"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500"
          />
          {loading && (
            <span className="animate-pulse text-xs text-gray-400">searching…</span>
          )}
          <button
            onClick={onClose}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  onClick={() => navigate(r)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i === selectedIdx
                      ? "bg-indigo-50 dark:bg-indigo-950/40"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[r.priority] ?? "bg-gray-300"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {r.projectKey && r.number > 0 && (
                        <span className="mr-1.5 font-mono text-xs text-gray-400 dark:text-gray-500">
                          {r.projectKey}-{r.number}
                        </span>
                      )}
                      {r.title}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {r.projectName}
                    </span>
                  </span>
                  {i === selectedIdx && (
                    <CornerDownLeft className="h-3.5 w-3.5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
            No tasks found for &ldquo;{query}&rdquo;
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-600">
            Type to search tasks across all projects
          </div>
        )}

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            navigate
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
            <CornerDownLeft className="h-3 w-3" />
            open
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-600">esc close</span>
        </div>
      </div>
    </div>
  );
}

// Exported component — manages open state and keyboard shortcut
export default function CommandPalette() {
  const [open, setOpen] = useState(false);

  // Global keyboard shortcut — setState inside event handler, not effect body
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;
  return <CommandPaletteDialog onClose={() => setOpen(false)} />;
}
