# Bible Tour — project guide

"Tour of the Bible" — a companion to Matt Whitman's *Lightning-Fast Field Guide to the Bible*.
Two-part product, one repo:

- **Web** — Next.js 16 (`app/`), deployed to `bible-tour.vercel.app`. Hosts `/privacy`, `/support`,
  the verse proxies, and the Eagle Method study view.
- **Mobile** — Expo / React Native (`mobile/`). Bundle id `cloud.askadam.bibletour`.

## Invariants — do not regress these

These are compliance- and privacy-critical. Breaking one changes our App Store answers or our licensing standing.

1. **API keys never leave the server.** `YOUVERSION_API_KEY` and `ESV_API_KEY` live only in the
   Next.js server. Clients (web *and* mobile) call our proxies — `app/api/verse`, `app/api/verse-esv`,
   `app/api/verse-audio` — never a third-party API directly.
2. **Zero analytics / ad SDKs in the mobile bundle.** `@vercel/analytics` is **web-only**
   (`app/layout.js`, `app/privacy`). It must never be imported into `mobile/`. The App Privacy
   nutrition label depends on this staying true — re-verify before every iOS submission.
3. **No accounts, no backend, no PII.** Progress is `localStorage` (web) / on-device (mobile) only.
4. **Licensed text is not persisted.** NIV / NIrV / NIVUK (YouVersion) are session-only per the
   Developer Agreement — no offline cache. Attribution strings are required per translation.

## Skills to use (installed)

- **`eas-app-stores`** — any release work: `eas build` / `eas submit`, version & build-number bumps,
  TestFlight, `eas.json` profiles, store metadata / ASO.
- **`app-store-submission-auditor`** — run before every iOS submission to catch rejection risks.
- **GitHub MCP** — repo/PR/release operations (e.g. publishing the public lexicon subset, #11).
- **`new-blog-post`** + **`unslop`** — launch content (blog, LinkedIn) and de-slopping any copy.

## Release process (per version)

Current: iOS 1.0.3 build 10 · Android 1.0.3 versionCode 11.

1. Bump `version` in `mobile/app.json` (+ `buildNumber` iOS, `versionCode` Android) and add a
   `CHANGELOG.md` entry. Sanity-check `mobile/eas.json` (it has been fragile after merge conflicts).
2. `cd mobile && npm run build:all` (`eas build --platform all --profile production`).
3. Run `app-store-submission-auditor`, then `eas submit --platform ios --profile production --latest`.
4. Android `eas submit` is **blocked until Play Console approval** (verification deadline 30 Sep 2026).
5. Store copy is copy/paste-ready in `docs/store-submission.md`.

## Data pipeline

`npm run build:data` (root) rebuilds lexicon + tagged verses + canon from `scripts/build-*.mjs`.
Provenance and licences: `DATA-SOURCES.md`. Adding a translation/source is a **licensing gate** —
clear it against `docs/mobile-licensing-checklist.md` before shipping.

## Key docs

- `docs/handoff-todo.md` — current launch to-do and status.
- `docs/mobile-licensing-checklist.md` — the phase-0 compliance gate.
- `docs/store-submission.md` — copy/paste pack for ASC + Play Console.
- `docs/project-decisions.md` — decisions of record.
