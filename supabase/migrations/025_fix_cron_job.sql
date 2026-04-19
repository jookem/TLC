-- Remove old cron job that passed a null Bearer token
SELECT cron.unschedule('lesson-reminders-hourly');

-- Recreate without auth header (function is deployed with --no-verify-jwt)
SELECT cron.schedule(
  'lesson-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ocmguezbtirxymxklray.supabase.co/functions/v1/send-lesson-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  )
  $$
);
