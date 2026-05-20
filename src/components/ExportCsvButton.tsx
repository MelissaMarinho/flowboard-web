"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function ExportCsvButton({
  projectId,
  projectName,
  compact = false,
}: {
  projectId: string;
  projectName: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-tasks.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — could add a toast here later
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-md border border-gray-200 bg-white font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700 transition-colors ${compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm gap-2"}`}
    >
      <Download className="h-4 w-4" />
      {loading ? "Exporting…" : "Export CSV"}
    </button>
  );
}
