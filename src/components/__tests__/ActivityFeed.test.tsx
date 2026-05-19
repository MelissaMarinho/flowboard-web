import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ActivityFeed from "../ActivityFeed";

const mockActivities = [
  {
    id: "act-1",
    type: "TASK_CREATED",
    meta: { taskId: "t1", taskTitle: "Set up CI pipeline" },
    createdAt: new Date(Date.now() - 60_000).toISOString(), // 1 min ago
    user: { id: "u1", name: "Jane Doe", image: null },
  },
  {
    id: "act-2",
    type: "TASK_UPDATED",
    meta: { taskId: "t1", taskTitle: "Set up CI pipeline", changes: ["status → IN_PROGRESS"] },
    createdAt: new Date(Date.now() - 3_600_000).toISOString(), // 1 hour ago
    user: { id: "u1", name: "Jane Doe", image: null },
  },
  {
    id: "act-3",
    type: "AI_SUMMARY_GENERATED",
    meta: { projectName: "FlowBoard" },
    createdAt: new Date(Date.now() - 86_400_000).toISOString(), // 1 day ago
    user: { id: "u1", name: "Jane Doe", image: null },
  },
];

describe("ActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeletons initially", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {}))); // never resolves
    const { container } = render(<ActivityFeed projectId="proj-1" />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it("renders activity entries after fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => mockActivities })
    );
    render(<ActivityFeed projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText(/created "Set up CI pipeline"/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it("shows changes in update entries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => mockActivities })
    );
    render(<ActivityFeed projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText(/status → IN_PROGRESS/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it("shows AI summary activity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => mockActivities })
    );
    render(<ActivityFeed projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText(/generated an AI summary/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it("shows empty state when no activities", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
    render(<ActivityFeed projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it("shows relative timestamps", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => mockActivities })
    );
    render(<ActivityFeed projectId="proj-1" />);
    await waitFor(() => {
      expect(screen.getByText("1m ago")).toBeInTheDocument();
      expect(screen.getByText("1h ago")).toBeInTheDocument();
      expect(screen.getByText("1d ago")).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });
});
