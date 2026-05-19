import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfileForm from "../ProfileForm";

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with the initial name pre-filled", () => {
    render(<ProfileForm initialName="Jane Doe" email="jane@example.com" />);
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
  });

  it("renders the email field", () => {
    render(<ProfileForm initialName="Jane" email="jane@example.com" />);
    expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
  });

  it("email field is read-only", () => {
    render(<ProfileForm initialName="Jane" email="jane@example.com" />);
    expect(screen.getByDisplayValue("jane@example.com")).toHaveAttribute("readonly");
  });

  it("disables save button when name is empty", () => {
    render(<ProfileForm initialName="" email="jane@example.com" />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("enables save button when name has content", () => {
    render(<ProfileForm initialName="Jane" email="jane@example.com" />);
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled();
  });

  it("shows success message after a successful save", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: "Jane Doe" }) })
    );
    render(<ProfileForm initialName="Jane Doe" email="jane@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText("Profile updated.")).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it("shows error message when save fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<ProfileForm initialName="Jane Doe" email="jane@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it("clears success message when name is changed after save", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: "Jane Doe" }) })
    );
    render(<ProfileForm initialName="Jane Doe" email="jane@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => screen.getByText("Profile updated."));

    fireEvent.change(screen.getByDisplayValue("Jane Doe"), {
      target: { value: "Jane Smith" },
    });
    expect(screen.queryByText("Profile updated.")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
