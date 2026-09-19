-- Seed data for the local stack only; never executes against the hosted
-- project. `bun db:reset` runs it every time. `bun db:start` runs it only when
-- it initialises the database volume — a later stop/start reuses that volume
-- and does not re-seed, so reach for `bun db:reset` to get this account back.
--
-- Creates the dedicated e2e account that e2e/global-setup.ts signs in as. On
-- hosted this account was provisioned by hand (see issue #45); locally it has
-- to be seeded, because there is no inbox to confirm a sign-up against and the
-- app's own UI only offers passwordless OTP/magic-link login.
--
-- The credentials below are local-only fixtures, not secrets. They must match
-- E2E_TEST_EMAIL / E2E_TEST_PASSWORD in .env.local.example.

DO $$
DECLARE
  e2e_email text := 'e2e@lifeos.local';
  e2e_password text := 'e2e-local-password';
  e2e_user_id uuid := '00000000-0000-4000-8000-000000000e2e';
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    -- GoTrue scans these into plain Go strings, so a NULL here fails every
    -- sign-in with a 500 "Database error querying schema". They are nullable
    -- in the table and default to NULL, so they have to be set explicitly.
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    e2e_user_id,
    'authenticated',
    'authenticated',
    e2e_email,
    extensions.crypt(e2e_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- GoTrue refuses password sign-in for a user with no matching email identity.
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    e2e_user_id::text,
    e2e_user_id,
    jsonb_build_object('sub', e2e_user_id::text, 'email', e2e_email, 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;
END
$$;
