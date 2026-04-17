@AGENTS.md

## Supabase Edge Functions

Always deploy edge functions with `--no-verify-jwt`:
```
npx supabase functions deploy <name> --no-verify-jwt
```
The newer Supabase CLI defaults to JWT verification enabled, which conflicts with how all existing functions in this project are deployed. Without `--no-verify-jwt`, new functions return 401 even for authenticated users.
