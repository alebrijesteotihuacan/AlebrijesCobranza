import "@testing-library/jest-dom/vitest";

// Mock next/font (used in layout)
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Bebas_Neue: () => ({ variable: "--font-bebas" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock env
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
