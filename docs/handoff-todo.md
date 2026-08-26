# Handoff To-Do — App Store Launch

Pick this up from a fresh chat. Snapshot taken 2026-04-28 on branch `claude/cross-platform-app-compliance-Wy8HQ`.

## Where things stand

Two-part product:
- **Web app** (Next.js 16) — [app/](../app), deployed to `bible-tour.vercel.app`. Hosts `/privacy`, `/support`, the verse proxies (`/v1/verse*`), and the Eagle Method study view.
- **Mobile app** (Expo / React Native) — [mobile/](../mobile). Bundle id `cloud.askadam.bibletour`. iOS configured for App Store submission via EAS; Android profile added but waiting on Play Console approval.

Active branch is 1 commit ahead of `origin/main`. Branch [claude/sharp-driscoll-92cd28](#) has 7 unmerged commits (KJV source credit refactor) — decide whether to merge or close.

## App Store checklist — confirmed status

Done: #1 Privacy Manifest · #2 Privacy Policy URL · #3 Support URL · #4 App icon (gold-amber lightning bolt on navy-teal — SVG sources in [mobile/assets/icon-source/](../mobile/assets/icon-source/), rendered to `icon.png` / `adaptive-icon.png` / `splash-icon.png` / `icon-playstore-512.png` / `favicon.png`) · #5 Production EAS profile · #6 YouVersion Express Licensing · #9 Hide test button in prod · #10 Audio session config · #12 Replace kaiserlik/kjv · #13 TMBH non-objection · #14 Network-failure audit · #17 Universal Links

**Remaining for v1 launch:**
- **#7 App Privacy nutrition label** — manual click-through in App Store Connect. Ask the next chat to generate the answer matrix; you click it through.
- **#8 App Store description** — draft exists at [docs/app-store-listing.md](app-store-listing.md). Needs final polish + paste into ASC and (later) Play Console.
- **#11 Publish lexicon subset to public repo** — decide a GitHub repo name, then publish the CC BY-SA 3.0 subset built by [scripts/build-lexicon.mjs](../scripts/build-lexicon.mjs). Currently only documented in [DATA-SOURCES.md](../DATA-SOURCES.md).

## Android — blocked on Play Console

Submit profile is wired in [mobile/eas.json](../mobile/eas.json). Full step-by-step in [docs/android-submission-steps.md](android-submission-steps.md). Resume there once developer account is approved. Play developer verification deadline is 30 Sept 2026.

## Other things flagged by repo survey

- **Untracked file:** [docs/blog-post-bible-tour-and-eagle.md](blog-post-bible-tour-and-eagle.md) (~800 lines). Narrative essay on the product. Decide: commit, move out of repo, or delete.
- **Vercel Analytics in mobile?** [project-decisions.md](project-decisions.md) §9 says "remove or replace with opt-in" for mobile. Verify analytics aren't pulled into the Expo bundle before iOS submission — otherwise the App Privacy answers in #7 must change.
- **API quotas + alerting** — no monitoring on the Crossway / YouVersion proxies. Listed as outstanding in [mobile-licensing-checklist.md](mobile-licensing-checklist.md) §10. Not a blocker for v1, but pre-launch hygiene.
- **API key rotation runbook** — also §10 of the licensing checklist. Document where keys live + rotation cadence.
- **No tests** — neither [app/](../app) nor [mobile/](../mobile) has a test runner. Acceptable for v1 but worth noting.
- **eas.json fragility** — recent commits (`8fb70ab`, `a72d205`) were fixes after merge conflicts. Sanity-check before any `eas build`.
- **Postinstall patch** — [mobile/scripts/patch-expo-image.js](../mobile/scripts/patch-expo-image.js) runs on `npm install`. If it ever silently fails, image rendering on iOS will break.

## Prioritized to-do (do roughly in this order)

1. **#8 — Polish the App Store description** ([docs/app-store-listing.md](app-store-listing.md)). Paste into App Store Connect.
2. **#7 — App Privacy nutrition matrix.** Ask next chat to produce the answer table; you click through ASC. Verify Vercel Analytics is excluded from mobile *before* answering.
3. **#11 — Publish lexicon repo.** Pick a repo name, scaffold README + LICENSE (CC BY-SA 3.0), push the subset. Update [DATA-SOURCES.md](../DATA-SOURCES.md) with the public link.
4. **Decide on `claude/sharp-driscoll-92cd28`** — merge the KJV credit refactor or close it.
5. **Decide on the blog post draft** — commit, relocate, or delete [docs/blog-post-bible-tour-and-eagle.md](blog-post-bible-tour-and-eagle.md).
6. **Submit iOS to App Store Connect** once #7 and #8 are done.
   - **Carry-along change:** the default reading translation is now **NIV** (was KJV), merged in [#30](https://github.com/adamswbrown/bible-tour/pull/30). It's already live on web (Vercel), but iOS has **no OTA path** (`expo-updates` not installed), so it's baked into the bundle and won't reach devices until the next App Store build. Bump `mobile/app.json` `version` (currently `1.0.0`) before building. No standalone release needed — let it ride with this submission.
7. **Android** — resume [docs/android-submission-steps.md](android-submission-steps.md) when Play Console clears.
9. **Post-launch hygiene:** API quota alerts, key rotation runbook, support-email triage cadence.

## Useful commands

```bash
# Web (from repo root)
npm run dev            # next dev
npm run build:data     # rebuild lexicon + tagged-verses

# Mobile
cd mobile
npm start              # expo
npm run build:all      # eas build --platform all --profile production
eas submit --platform ios --profile production --latest
eas submit --platform android --profile production --latest   # blocked until Play Console approved
```

## Pointer for the next chat

Start by reading: this file → [mobile-licensing-checklist.md](mobile-licensing-checklist.md) → [project-decisions.md](project-decisions.md) → recent `git log --oneline -20`. That's enough to act.
