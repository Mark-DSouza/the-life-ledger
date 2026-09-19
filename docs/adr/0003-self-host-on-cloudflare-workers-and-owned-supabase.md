---
status: accepted
---

# Self-host on Cloudflare Workers with an owned Supabase project

LifeOS was published by Lovable, and its database was a Lovable Cloud–managed
Supabase project. The owner controlled neither. This ADR records the decisions
behind moving off both, taken on
[PRD: Migrate LifeOS off Lovable](https://github.com/Mark-DSouza/the-life-ledger/issues/61).
It supersedes the approach in the earlier
[PRD #16](https://github.com/Mark-DSouza/the-life-ledger/issues/16) and its
slices #17–#22, closed `wontfix` on 2026-09-17 — that plan targeted a bare
`workers.dev` URL, predated Offloader, chose Cloudflare Workers Builds before
this repo hardened its Actions posture (see
[ADR 0001](0001-pin-actions-and-scope-security-scanning.md)), and gated deploys
on "the existing vitest suite", which does not exist. The destination is the
same; most of the reasoning below is not.

## The decision

The app runs on a personally-owned **Cloudflare Workers** account, served at
`life-os.markdsouza.dev`, backed by a new **Supabase project in the owner's own
account** (`ap-south-1`, Postgres 17). Auth email is delivered through
**Amazon SES**, in sandbox mode with the single recipient verified. **AWS is
used for nothing else** — no compute, no storage, no database. Deploys run from
a GitHub Actions workflow gated on this repo's existing aggregated `ci` status.

Everything below is a rejected alternative. Those are the parts that will
otherwise be re-proposed in six months.

## Decisions and why

**The repo's migration files are the source of truth for the new schema, not a
dump of the Lovable-hosted schema.** The obvious move when standing up a
replacement database is to dump the old one and restore it, and #16 went
further still, planning to diff hosted against the migration files first and
capture any drift as a new migration. Both are unnecessary here, because **no
data is carried across**: the owner confirmed the hosted database holds nothing
of value, and the single user re-registers. Once nothing is being preserved,
fidelity to the hosted schema stops being a requirement — the only requirement
is that the schema supports the app, and the Playwright e2e suite measures that
directly by driving the real app against a database built purely from the
migration files. A dump would additionally import whatever Lovable's agent
applied outside a migration, which is exactly the coupling this migration
exists to cut.

This **retires the drift question rather than answering it**. The files are
true of the new project by construction, and running `bun db:diff --linked`
against it once its password is held gives the new backend a measured baseline
from day one — the thing hosted never had (see the "Local database" section of
`CLAUDE.md`, and
[#57](https://github.com/Mark-DSouza/the-life-ledger/issues/57), which made the
files replay from empty in the first place).

**Deploys run from GitHub Actions, not Cloudflare Workers Builds.** Workers
Builds is the path of least resistance — no CI YAML to write, no API token to
mint — and #16 chose it for exactly that reason. It is rejected here because
this repo now has a deliberately hardened pipeline: every `uses:` pinned to a
commit SHA, CodeQL, dependency review at `fail-on-severity: low`, and one
aggregated `ci` status that branch protection gates on. Workers Builds would
stand a **second, parallel pipeline** beside that one, with its own checkout,
its own install and its own notion of what passes — the deploy path becoming
the one place in the repo where none of ADR 0001 applies. It is also
**configured in a dashboard rather than in git**: the build command, the branch
filter and the environment variables would live in Cloudflare's UI, invisible
to review and unreproducible from a clone. A GitHub Actions job that waits on
`ci` and then runs a SHA-pinned deploy action reuses the posture that already
exists, and the whole deploy is readable in a diff.

**The app is served at a subdomain, not at a path under the apex.** The apex
serves the owner's portfolio, so `markdsouza.dev/life-os` looks like the tidier
arrangement — one hostname, one certificate, no DNS record to add. It does not
work. Server functions are requested at the root-absolute path `/_serverFn/...`
and client assets at `/assets/...`, neither of which falls under a `/life-os*`
route, so **the entire persistence layer breaks** — not degrades. Making it
work would mean Vite `base`, TanStack Router `basepath` and Start server path
handling, then re-verifying SSR, the sitemap route and the OTP redirect (which
passes a bare `window.location.origin`). A subdomain costs zero code changes,
and gives the app its own `localStorage` origin, so its auth session storage is
isolated from anything else served from the apex. The hostname is declared in
the wrangler config as a Workers Custom Domain (`routes` with
`custom_domain: true`) rather than clicked in a dashboard, for the same reason
the deploy is not Workers Builds.

**AWS is not the app target, despite an AWS account being available and used
for SES.** Consolidating onto one cloud is a reasonable instinct, and it is
wrong here: **the build already produces a Cloudflare Worker.** Retargeting
would mean changing the Nitro preset and the server entry (`src/server.ts`,
which wraps Start's bundled SSR entry to catch h3's swallowed 500s) at the same
moment as changing databases, so a failure would have two suspects instead of
one. Cloudflare is where the artifact already runs; SES is used because email
delivery is the one thing Cloudflare does not offer and `markdsouza.dev` has no
MX and no SPF record, so DKIM/SPF setup is purely additive. That is the whole
of AWS's role.

**The Lovable Vite package is ejected as part of this migration, not after
it.** #16 deliberately kept `@lovable.dev/vite-tanstack-config` through the
cutover, to change one variable at a time. That is reversed here for a concrete
reason: **69 packages in `bun.lock` resolve from a private Lovable npm mirror**
(`europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`), and CI runs
`bun install --frozen-lockfile`, so a vendor being exited sits on the critical
path of every build. Removing the package forces the lockfile regeneration that
removes those URLs. The one-variable-at-a-time principle is preserved by
ordering rather than by scope: the eject lands **first**, verified by the full
existing gate while the Lovable deployment is still up to compare against, and
the hosting move follows.

## Not covered here

- The provisioning steps, the cutover sequence and the Lovable retirement
  schedule, which live in
  [#61](https://github.com/Mark-DSouza/the-life-ledger/issues/61) and its
  tickets — this ADR is the decision record, not the runbook.
- `CLAUDE.md`'s description of the build and the deployment, which is corrected
  by the tickets that change them.
