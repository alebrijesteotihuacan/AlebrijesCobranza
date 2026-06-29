import { describe, it, expect } from "vitest";
import { t, translate, DEFAULT_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, type TranslationKey } from "@/lib/i18n";

describe("i18n", () => {
  it("returns Spanish translations when locale=es", () => {
    expect(t("es", "common.save")).toBe("Guardar");
    expect(t("es", "nav.dashboard")).toBe("Dashboard");
  });

  it("returns English translations when locale=en", () => {
    expect(t("en", "common.save")).toBe("Save");
    expect(t("en", "nav.clientes")).toBe("Customers");
  });

  it("translate() defaults to 'es'", () => {
    expect(translate()("common.save")).toBe("Guardar");
    expect(translate("en")("common.save")).toBe("Save");
  });

  it("default locale is 'es'", () => {
    expect(DEFAULT_LOCALE).toBe("es");
  });

  it("has 'es' and 'en' as supported locales", () => {
    expect(SUPPORTED_LOCALES).toContain("es");
    expect(SUPPORTED_LOCALES).toContain("en");
  });

  it("has labels for each supported locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[loc]).toBeTruthy();
    }
  });

  it("TranslationKey type narrows the keyspace", () => {
    // This is a compile-time check; if the test compiles, it works.
    const k: TranslationKey = "common.save";
    expect(k).toBe("common.save");
  });
});
