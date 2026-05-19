"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Crown, User } from "lucide-react";

interface Member {
  id: string;
  role: "OWNER" | "MEMBER";
  user: { id: string; name: string | null; email: string; image: string | null };
}

export default function InviteMemberModal({
  workspaceId,
  workspaceName,
  onClose,
}: {
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [fetchingMembers, setFetchingMembers] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function loadMembers() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) setMembers(await res.json());
    } finally {
      setFetchingMembers(false);
    }
  }

  useEffect(() => { loadMembers(); }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to invite");
      setSuccess(`${email.trim()} has been added to the workspace.`);
      setEmail("");
      await loadMembers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to invite member.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Team Members</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">{workspaceName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Invite form */}
        <form onSubmit={invite} className="mb-5 flex gap-2">
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSuccess(""); setError(""); }}
            placeholder="colleague@example.com"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {loading ? "Adding…" : "Invite"}
          </button>
        </form>

        {success && <p className="mb-3 text-sm text-green-600">{success}</p>}
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        {/* Members list */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Members ({members.length})
          </p>
          {fetchingMembers ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {m.user.image ? (
                    <img src={m.user.image} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {m.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {m.user.name ?? "Unknown"}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{m.user.email}</p>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.role === "OWNER"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.role === "OWNER" ? (
                      <Crown className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
