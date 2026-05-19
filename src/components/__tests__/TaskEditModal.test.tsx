import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskEditModal from "../TaskEditModal";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const mockTask = {
  id: "task-1",
  title: "Write unit tests",
  description: null,
  status: "TODO" as TaskStatus,
  priority: "MEDIUM" as TaskPriority,
  dueDate: null,
  projectId: "proj-1",
  assigneeId: null,
  assignee: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("TaskEditModal", () => {
  const onClose = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with the task title pre-filled", () => {
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />);
    expect(screen.getByDisplayValue("Write unit tests")).toBeInTheDocument();
  });

  it("renders all required form fields", () => {
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it("pre-selects the current priority", () => {
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />);
    const select = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    expect(select.value).toBe("MEDIUM");
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const { container } = render(
      <TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />
    );
    // Click the backdrop (first child is the overlay div)
    fireEvent.click(container.firstChild!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("disables Save button when title is empty", () => {
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />);
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: "" } });
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows assignee picker when members are provided", () => {
    const members = [{ id: "user-1", name: "Alice", image: null }];
    render(
      <TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} members={members} />
    );
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
  });

  it("does not show assignee picker when members list is empty", () => {
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} members={[]} />);
    expect(screen.queryByLabelText(/assignee/i)).not.toBeInTheDocument();
  });

  it("shows error message when save request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it("calls onSave and onClose when save succeeds", async () => {
    const updatedTask = { ...mockTask, title: "Write unit tests", priority: "HIGH" as TaskPriority };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => updatedTask })
    );
    render(<TaskEditModal task={mockTask} onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(updatedTask);
      expect(onClose).toHaveBeenCalledOnce();
    });
    vi.unstubAllGlobals();
  });
});
