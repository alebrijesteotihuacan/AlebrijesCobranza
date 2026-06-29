import { z } from "zod";

/**
 * Cliente schema (Zod) for create/update actions.
 * - whatsapp: must be 52 + 10 digits (Mexican format, no +)
 * - dia_pago: only 15 or 30
 * - monto: positive, max 99,999.99 MXN
 */
export const clienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^52\d{10}$/, "Debe ser 52 + 10 dígitos (ej. 5215512345678)"),
  dia_pago: z
    .union([z.literal(15), z.literal(30)])
    .refine((v) => v === 15 || v === 30, "Día de pago debe ser 15 o 30"),
  monto: z
    .number({ message: "Monto requerido" })
    .positive("El monto debe ser mayor a 0")
    .max(99999.99, "El monto no puede exceder $99,999.99"),
  categoria: z.string().trim().max(50).optional().nullable(),
  notas: z.string().trim().max(500).optional().nullable(),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;

export const pagoSchema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Periodo debe ser YYYY-MM"),
  monto: z.number().positive(),
  metodo: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});
