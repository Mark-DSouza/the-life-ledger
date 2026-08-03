---
status: accepted
---

# Pin all GitHub Actions to commit SHAs; scope security scanning to CodeQL + dependency-review only

Every `uses:` in `.github/workflows/*.yml` is pinned to a commit SHA (with a
`# vX.Y.Z` comment) rather than a tag, since a tag is a pointer its owner can
move — the reasoning [Mark-DSouza/god-mode-code](https://github.com/Mark-DSouza/god-mode-code)
documents inline, citing the tj-actions/changed-files supply-chain compromise
(March 2025). `.github/dependabot.yml` keeps the pins from going stale.

`security.yml` was modeled on the same repo's security workflow but scoped
down deliberately: this repo is a single TanStack Start app with no
Java/Go/Terraform/Docker/AWS surface, so CodeQL only analyzes
`javascript-typescript`, and Trivy (IaC misconfiguration scanning) and the
AWS-specific `deploy.yml` were not ported — there is no infrastructure-as-code
or self-managed deploy path here to scan. `dependency-review-action` runs at
`fail-on-severity: low`, the strict end of the scale, since it only gates
packages a pull request newly adds — a substitute is still cheap at that
point, unlike a whole-repository sweep of what's already installed.
