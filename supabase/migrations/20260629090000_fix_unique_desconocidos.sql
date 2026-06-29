-- =============================================================
-- Migration: 20260629090000_fix_unique_desconocidos
-- Add UNIQUE constraint to mensajes_desconocidos.whatsapp_message_id
-- (the initial migration forgot this; webhook's upsert requires it)
-- =============================================================

-- First clean any existing duplicates using row_number
delete from public.mensajes_desconocidos
where id in (
  select id from (
    select id, row_number() over (partition by whatsapp_message_id order by recibido_at asc) as rn
    from public.mensajes_desconocidos
  ) t
  where rn > 1
);

-- Add the UNIQUE constraint
alter table public.mensajes_desconocidos
  add constraint mensajes_desconocidos_whatsapp_message_id_key
  unique (whatsapp_message_id);

-- Clean up test records from manual INSERTs
delete from public.mensajes_desconocidos
where whatsapp_from in ('test-direct', '521111111111');
