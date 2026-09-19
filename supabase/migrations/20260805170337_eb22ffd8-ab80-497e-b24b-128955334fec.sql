-- Explicit table privileges for offloader_items.
--
-- This file was originally a verbatim copy of 20260805152424_40b916f5 plus the
-- two GRANTs below. Lovable's agent regenerated types.ts from the hosted schema,
-- found offloader_items missing there, and wrote a whole second CREATE TABLE
-- rather than reconciling — so hosted ran this migration and not the earlier
-- one, and the pair could never replay together from an empty database:
--
--   ERROR: relation "offloader_items" already exists (SQLSTATE 42P07)
--
-- That broke `supabase start` on a fresh machine, `supabase db reset`, and
-- `supabase db diff` (which replays into a shadow database before it compares
-- against the remote). The duplicated DDL is dropped here and only the GRANTs
-- remain, which is what this migration uniquely contributed. Neither database
-- changes: hosted already has both migrations recorded as applied and will not
-- re-run this one, and locally 20260805152424 creates exactly the same objects.
-- See issue #57.
--
-- The GRANTs are themselves redundant on a stock Supabase database — ALTER
-- DEFAULT PRIVILEGES in the public schema already grants anon, authenticated
-- and service_role full table access. They are kept rather than deleted so the
-- migration still describes the privileges hosted was given, instead of
-- becoming an empty file that only history explains.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offloader_items TO authenticated;
GRANT ALL ON public.offloader_items TO service_role;
