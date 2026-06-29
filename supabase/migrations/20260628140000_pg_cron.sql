-- =============================================================
-- Migration: 20260628140000_pg_cron
-- Schedule daily reminder cron job
-- 9:00 AM America/Mexico_City (UTC-6) = 15:00 UTC
-- =============================================================

-- 1) Confirm pg_cron extension is enabled (idempotent)
create extension if not exists "pg_cron" with schema extensions;

-- 2) Schedule the daily cron job
--    '0 15 * * *' = minute=0, hour=15 UTC = 9:00 AM CST (Mexico)
--    NOTE: The X-Cron-Secret value below MUST match the CRON_SECRET
--    in Supabase Edge Function secrets. To rotate the secret, edit this
--    migration AND re-run `supabase secrets set CRON_SECRET=...` then redeploy.
select cron.schedule(
  'enviar-recordatorios-diarios',
  '0 15 * * *',
  $$
  select
    net.http_post(
      url    := 'https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/enviar-recordatorios',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'X-Cron-Secret', 'alebrijes_cron_secret_change_me'
      ),
      body  := '{}'::jsonb
    ) as request_id;
  $$
);

-- 3) Schedule a daily cleanup of comprobantes > 7 days old (pendientes)
--    Files of comprobantes with estado='pendiente' older than 7 days are deleted.
--    Runs at 14:30 UTC = 8:30 AM Mexico (before the reminders run at 9:00 AM).
select cron.schedule(
  'limpiar-comprobantes-expirados',
  '30 14 * * *',
  $$
  delete from storage.objects
  where bucket_id = 'comprobantes'
    and name in (
      select storage_path
      from public.comprobantes_recibidos
      where estado = 'pendiente'
        and recibido_at < (now() - interval '7 days')
        and storage_path is not null
    );
  $$
);
