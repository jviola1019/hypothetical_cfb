# Security notes and boundaries

Architecture: GitHub Pages-compatible static content; no accounts, secrets, server-side sessions, GraphQL, SQL, file upload, OAuth, third-party scripts or trusted multiplayer rankings. This eliminates entire categories of backend exploit surface but does not make the site secure by declaration.

- All scenario inputs validate against known IDs and bounded numeric settings. Duplicate tournament participants are rejected. In-browser seed edits swap assignments to preserve uniqueness.
- Incoming URL fragment (`#bracket=`) is capped, JSON-decoded, and validated through `createTournament()`; malformed fragments are rejected. Export is JSON, not executable code. There is no JSON import flow.
- Dynamic labels are escaped before `innerHTML`. Chart SVG strings come from numeric aggregates of locally generated data; no uploaded SVGs, remote embeds or HTML rendering from external sources.
- Monte Carlo game batch cap is 10,000 in engine. Browser UI is fixed at 1,200 game samples in a Worker (650 fallback) and 400 tournament draws (200 fallback); worker tasks chunk and can be terminated. Large custom brackets can still consume considerable resources.
- No security tokens derive from the synthetic RNG; results have no authentication or monetary value. A user can tamper with their own outputs; host-authoritative rankings require a validated backend.
- Github Actions workflows request limited permissions. Repository administrators must enable Actions/Pages and assess branch protection and dependency risk.

A restrictive CSP meta tag is included, but static GitHub Pages cannot universally set all HTTP response security headers (notably `frame-ancestors`, TLS/HSTS controls). For a stronger header policy use a compatible CDN/reverse proxy.

See `THREAT_MODEL.md` for 92-threat per-item architectural triage. Most backend-only entries are **not applicable to this static implementation**, not tested as absent vulnerabilities in hypothetical future backend services.

The optional `refresh-roster.yml` workflow downloads a CC0 upstream CSV over HTTPS; its real-source schema and content must be independently audited before trusting the generated data. It accepts no user-supplied URL and runs only by manual dispatch. Ingestion rejects malformed IDs, oversized CSVs, unsafe identifier/name values, duplicate IDs, nonfinite statistical values and unmatched joins. These checks are not a complete supply-chain security assessment.
