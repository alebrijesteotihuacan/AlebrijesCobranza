/**
 * Internationalization (i18n) for Alebrijes Cobranza
 *
 * Lightweight dictionary-based i18n without external dependencies.
 * To add a new language:
 *  1. Add a new key to the Dictionary type (e.g. "en" | "pt")
 *  2. Add a corresponding TRANSLATIONS object
 *  3. Update the type union
 *
 * Usage:
 *   import { useT } from "@/lib/i18n";
 *   const t = useT();
 *   <p>{t("common.save")}</p>
 *
 * For server components:
 *   import { t as translate } from "@/lib/i18n";
 *   const t = translate("es");
 *   <p>{t("common.save")}</p>
 */

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";

export const SUPPORTED_LOCALES: Locale[] = ["es", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
};

const TRANSLATIONS = {
  es: {
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.create": "Crear",
    "common.search": "Buscar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.confirm": "Confirmar",
    "common.cancel_action": "Cancelar acción",

    "nav.dashboard": "Dashboard",
    "nav.clientes": "Clientes",
    "nav.comprobantes": "Comprobantes",
    "nav.mensajes": "Mensajes",
    "nav.reportes": "Reportes",
    "nav.desconocidos": "Desconocidos",
    "nav.configuracion": "Configuración",
    "nav.admin": "Administradores",

    "auth.login": "Iniciar sesión",
    "auth.logout": "Cerrar sesión",
    "auth.email": "Email",
    "auth.password": "Contraseña",

    "cliente.nombre": "Nombre completo",
    "cliente.whatsapp": "WhatsApp",
    "cliente.dia_pago": "Día de pago",
    "cliente.monto": "Monto mensual",
    "cliente.categoria": "Categoría",
    "cliente.notas": "Notas",
    "cliente.activo": "Activo",
    "cliente.inactivo": "Inactivo",
    "cliente.placeholder.whatsapp": "5215512345678",

    "validation.required": "Requerido",
    "validation.invalid_email": "Email inválido",
    "validation.invalid_whatsapp": "Debe ser 52 + 10 dígitos (ej. 5215512345678)",
    "validation.invalid_dia_pago": "Día de pago debe ser 15 o 30",
    "validation.invalid_monto": "Monto debe ser mayor a 0",
  },
  en: {
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.confirm": "Confirm",
    "common.cancel_action": "Cancel action",

    "nav.dashboard": "Dashboard",
    "nav.clientes": "Customers",
    "nav.comprobantes": "Receipts",
    "nav.mensajes": "Messages",
    "nav.reportes": "Reports",
    "nav.desconocidos": "Unknown",
    "nav.configuracion": "Settings",
    "nav.admin": "Administrators",

    "auth.login": "Sign in",
    "auth.logout": "Sign out",
    "auth.email": "Email",
    "auth.password": "Password",

    "cliente.nombre": "Full name",
    "cliente.whatsapp": "WhatsApp",
    "cliente.dia_pago": "Payment day",
    "cliente.monto": "Monthly amount",
    "cliente.categoria": "Category",
    "cliente.notas": "Notes",
    "cliente.activo": "Active",
    "cliente.inactivo": "Inactive",
    "cliente.placeholder.whatsapp": "5215512345678",

    "validation.required": "Required",
    "validation.invalid_email": "Invalid email",
    "validation.invalid_whatsapp": "Must be 52 + 10 digits (e.g. 5215512345678)",
    "validation.invalid_dia_pago": "Payment day must be 15 or 30",
    "validation.invalid_monto": "Amount must be greater than 0",
  },
} as const;

export type TranslationKey = keyof (typeof TRANSLATIONS)["es"];

type Dictionary = Record<TranslationKey, string>;

const t = (locale: Locale, key: TranslationKey): string => {
  const dict = TRANSLATIONS[locale] as Dictionary;
  return dict[key] ?? key;
};

export { t };

/**
 * Server-side translation function.
 * Use in Server Components: `const t = translate("es");`
 */
export function translate(locale: Locale = DEFAULT_LOCALE) {
  return (key: TranslationKey): string => t(locale, key);
}
