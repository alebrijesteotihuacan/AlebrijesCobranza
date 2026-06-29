import { describe, it, expect } from "vitest";
import {
  formatMXN,
  formatWhatsApp,
  formatPeriodoLabel,
  formatRelativeTime,
  getCurrentPeriodo,
} from "@/lib/utils";

describe("formatMXN", () => {
  it("formats whole numbers as MXN", () => {
    expect(formatMXN(1500)).toContain("1,500");
  });
  it("formats decimals with 2 digits", () => {
    const s = formatMXN(1234.5);
    expect(s).toContain("1,234.50");
  });
  it("handles null/undefined", () => {
    expect(formatMXN(null)).toBe("—");
    expect(formatMXN(undefined)).toBe("—");
    expect(formatMXN("not a number")).toBe("—");
  });
  it("includes MXN currency marker", () => {
    expect(formatMXN(100)).toMatch(/\$|MXN/);
  });
});

describe("formatWhatsApp", () => {
  it("returns em-dash for null", () => {
    expect(formatWhatsApp(null)).toBe("—");
  });
  it("returns em-dash for empty", () => {
    expect(formatWhatsApp("")).toBe("—");
  });
  it("preserves the digits of a 10-digit number", () => {
    const r = formatWhatsApp("5512345678");
    expect(r.replace(/\D/g, "")).toBe("5512345678");
  });
  it("preserves the digits of a 12-digit number", () => {
    const r = formatWhatsApp("5215512345678");
    expect(r.replace(/\D/g, "")).toBe("5215512345678");
  });
});

describe("formatPeriodoLabel", () => {
  it("returns Spanish month name for valid periodo", () => {
    const s = formatPeriodoLabel("2026-06");
    expect(s.toLowerCase()).toContain("junio");
    expect(s).toContain("2026");
  });
  it("returns input unchanged for invalid periodo", () => {
    expect(formatPeriodoLabel("garbage")).toBe("garbage");
  });
});

describe("formatRelativeTime", () => {
  it("formats recent dates as seconds", () => {
    const s = formatRelativeTime(new Date(Date.now() - 30_000).toISOString());
    expect(s).toMatch(/Hace \d+s/);
  });
  it("formats minutes", () => {
    const s = formatRelativeTime(new Date(Date.now() - 5 * 60_000).toISOString());
    expect(s).toMatch(/Hace \d+ min/);
  });
  it("formats hours", () => {
    const s = formatRelativeTime(new Date(Date.now() - 3 * 3_600_000).toISOString());
    expect(s).toMatch(/Hace \d+h/);
  });
  it("formats days", () => {
    const s = formatRelativeTime(new Date(Date.now() - 2 * 86_400_000).toISOString());
    expect(s).toMatch(/Hace \d+d/);
  });
});

describe("getCurrentPeriodo", () => {
  it("returns YYYY-MM format", () => {
    const p = getCurrentPeriodo();
    expect(p).toMatch(/^\d{4}-\d{2}$/);
  });
});
