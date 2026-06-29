import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
  it("filters falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });
  it("handles conditional class", () => {
    expect(cn("base", true && "active", false && "disabled")).toBe("base active");
  });
  it("returns empty string when no args", () => {
    expect(cn()).toBe("");
  });
  it("resolves tailwind conflicts (later wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});
