"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

function timeAgo(isoStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function AISummaryPanel({
  projectId,
  initialSummary = null,
  initialSummaryAt = null,
}: {
  projectId: string;
  initialSummary?: string | null;
  initialSummaryAt?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialSummaryAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error("AI service error");
      const data: { content: string; createdAt: string } = await res.json();
      setSummary(data.content);
      setGeneratedAt(data.createdAt);
      setOpen(true);
    } catch {
      setError("Could not reach AI service. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => {
          if (!summary) {
            generate();
          } else {
            setOpen((o) => !o);
          }
        }}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{loading ? "Generating…" : "AI Summary"}</span>
        {summary && !loading && (
          open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {/* Accordion panel — renders in document flow, full-width via parent layout */}
      {open && summary && (
        <div className="absolute right-0 top-full z-10 mt-1.5 w-[520px] max-w-[calc(100vw-2rem)] rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-lg dark:border-indigo-800/60 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                AI Summary
              </p>
              {generatedAt && (
                <span className="text-xs text-indigo-400 dark:text-indigo-500">
                  · {timeAgo(generatedAt)}
                </span>
              )}
            </div>
            <button
              onClick={generate}
              disabled={loading}
              title="Regenerate"
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-indigo-500 hover:bg-indigo-100 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : (
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
