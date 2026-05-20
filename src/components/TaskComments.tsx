"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ user }: { user: Comment["user"] }) {
  if (user.image) {
    return <img src={user.image} alt={user.name ?? ""} className="h-7 w-7 rounded-full flex-shrink-0" />;
  }
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
      {user.name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export default function TaskComments({
  taskId,
  currentUserId,
}: {
  taskId: string;
  currentUserId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    // Optimistic: add a placeholder
    const tempId = `temp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      content: trimmed,
      createdAt: new Date().toISOString(),
      user: { id: currentUserId, name: "You", image: null },
    };
    setComments((prev) => [...prev, optimistic]);
    setContent("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) throw new Error();
      const saved: Comment = await res.json();
      setComments((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setContent(trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Comments
          {comments.length > 0 && (
            <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {comments.length}
            </span>
          )}
        </h2>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
          No comments yet. Be the first to leave one.
        </p>
      ) : (
        <ol className="mb-5 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-3">
              <Avatar user={c.user} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {c.user.name ?? "Someone"}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  {c.user.id === currentUserId && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="hidden rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-400 group-hover:block dark:text-gray-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {c.content}
                </p>
              </div>
            </li>
          ))}
          <div ref={bottomRef} />
        </ol>
      )}

      {/* New comment form */}
      <form onSubmit={submit} className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment… (Ctrl+Enter to post)"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-indigo-600 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 dark:placeholder-gray-500 dark:focus:bg-gray-800 transition-colors"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="flex-shrink-0 self-end rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          title="Post comment (Ctrl+Enter)"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
