"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { deriveKey, toProjectName } from "@/lib/project-utils";

export default function CreateProjectButton({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const derivedKey = name.trim() ? deriveKey(name) : "";

  function handleClose() {
    setOpen(false);
    setName("");
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: toProjectName(name),
        description: description.trim() || undefined,
        workspaceId,
      }),
    });
    setLoading(false);
    handleClose();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm font-medium text-gray-400 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-500 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
      >
        <Plus className="h-4 w-4" />
        New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create project</h2>
              <button onClick={handleClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>

              {/* Key — read-only, auto-derived */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project key
                  <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                    auto-generated
                  </span>
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm font-semibold text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 min-w-[3.5rem]">
                    {derivedKey || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </span>
                  {derivedKey && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Tasks will be{" "}
                      <span className="font-mono font-medium text-indigo-500">
                        {derivedKey}-1
                      </span>
                      ,{" "}
                      <span className="font-mono font-medium text-indigo-500">
                        {derivedKey}-2
                      </span>
                      …
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="mt-1 block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
