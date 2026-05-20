"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

function deriveKey(name: string): string {
  const words = name.trim().split(/[\s\-_]+/).filter(Boolean);
  const raw =
    words.length >= 2
      ? words.map((w) => w[0]).join("")
      : words[0] ?? "";
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

export default function CreateProjectButton({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleNameChange(value: string) {
    setName(value);
    // Auto-derive key from name unless user has manually edited it
    if (!keyTouched) {
      setKey(deriveKey(value));
    }
  }

  function handleKeyChange(value: string) {
    setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5));
    setKeyTouched(true);
  }

  function handleClose() {
    setOpen(false);
    setName("");
    setKey("");
    setKeyTouched(false);
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, workspaceId, key: key || deriveKey(name) }),
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project key
                  <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                    (max 5 characters, auto-generated)
                  </span>
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={key}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder="e.g. WR"
                    maxLength={5}
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
                  />
                  {key && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Tasks will be labelled{" "}
                      <span className="font-mono font-medium text-indigo-500">{key}-1</span>,{" "}
                      <span className="font-mono font-medium text-indigo-500">{key}-2</span>…
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="mt-1 block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="flex justify-end gap-2">
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
