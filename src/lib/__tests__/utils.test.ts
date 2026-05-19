import { describe, it, expect } from "vitest";
import { slugify, cn } from "../utils";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("My Project")).toBe("my-project");
  });

  it("strips special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("trims surrounding whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("handles numbers", () => {
    expect(slugify("Project 2024")).toBe("project-2024");
  });
});

describe("cn", () => {
  it("merges multiple class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("ignores falsy values", () => {
    expect(cn("base", false && "hidden", undefined, "visible")).toBe("base visible");
  });

  it("deduplicates conflicting Tailwind utilities (last wins)", () => {
    expect(cn("px-4", "px-8")).toBe("px-8");
  });

  it("handles conditional objects", () => {
    expect(cn({ "text-red-500": true, "text-green-500": false })).toBe("text-red-500");
  });
});
