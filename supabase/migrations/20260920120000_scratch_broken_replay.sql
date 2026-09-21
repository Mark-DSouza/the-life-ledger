-- SCRATCH: deliberately non-replaying migration, for verifying issue #66's CI
-- gate. Never merge this. It reproduces the failure #57 found — a second
-- CREATE TABLE for a table an earlier migration already created — which is
-- invisible to lint, typecheck, build and e2e and only shows up on a replay
-- from an empty database.
create table public.offloader_items (id uuid primary key);
