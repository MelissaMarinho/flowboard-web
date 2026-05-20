"use client";

import { useState } from "react";
import { Wand2, X, Check, CheckCheck } from "lucide-react";

interface Suggestion {
  id: string;
  suggestedPriority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

const priorityColor = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-600",
};

export default function AIPrioritizeButton({
  projectId,
  compact = false,
}: {
  projectId: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error("AI service error");
      const { suggestions } = await res.json();
      if (!suggestions || suggestions.length === 0) {
        setError("No tasks to prioritize.");
        return;
      }
      setSuggestions(suggestions);
    } catch {
      setError("Could not reach AI service. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  async function applyAll() {
    if (!suggestions) return;
    setApplying(true);
    try {
      await Promise.all(
        suggestions.map((s) =>
          fetch(`/api/tasks/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority: s.suggestedPriority }),
          })
        )
      );
      setSuggestions(null);
      window.location.reload();
    } catch {
      setError("Failed to apply some suggestions.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <button
        onClick={generate}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900 transition-colors ${compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm gap-2"}`}
      >
        <Wand2 className="h-4 w-4" />
        {loading ? "Analysing…" : "AI Prioritize"}
      </button>

      {(suggestions || error) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setSuggestions(null); setError(""); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">AI Priority Suggestions</h2>
              <button
                onClick={() => { setSuggestions(null); setError(""); }}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-500">
                  <span className="text-gray-500 dark:text-gray-400">Review the suggested priorities below, then apply them all at once.</span>
                </p>
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                  {suggestions!.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[s.suggestedPriority]}`}
                          >
                            {s.suggestedPriority}
                          </span>
                          <span className="text-xs text-gray-400 font-mono truncate dark:text-gray-500">{s.id.slice(-8)}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.reason}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setSuggestions(null)}
                    className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={applyAll}
                    disabled={applying}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" />
                    {applying ? "Applying…" : "Apply All"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
