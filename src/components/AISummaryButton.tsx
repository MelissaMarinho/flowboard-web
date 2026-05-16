"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function AISummaryButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    setLoading(false);
    window.location.reload();
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
    >
      <Sparkles className="h-4 w-4" />
      {loading ? "Generating…" : "AI Summary"}
    </button>
  );
}
