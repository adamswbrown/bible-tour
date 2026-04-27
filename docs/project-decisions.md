# Tour of the Bible — Project Decisions

Durable, project-level constraints. Not items to revisit per release — they shape every compliance and architecture decision downstream.

Owner: Adam
Last updated: 2026-04-27

---

## Hard rules

- **Never monetise.** No paid app, no paid features, no donations, no tip jars, no advertising, no sponsorships. Permanent.
- **No AI / LLM features.** No "summarise this passage," no "explain this verse," nothing generative. Permanent. Closes the YouVersion AI clause without further negotiation.
- **No accounts.** Account-less forever. Progress sync uses iCloud Key-Value Store (iOS) and Android Auto Backup (Android) — the user's existing Apple ID / Google account at the OS level, nothing we build or manage. Same-device-family sync only; cross-platform (iPhone → Android) sync is not a goal.
- **Local-only notifications.** Encouragement-style only ("keep up the good work," streak reminders, opt-in daily reading prompt). Scheduled on-device from local data. No APNs / FCM server, no device-token collection, no subscription database.
- **No offline mode for licensed text.** NIV / NIrV / NIVUK / ESV are streaming-only via the server-side proxies. Offline reading is not a v1 feature and may never be needed. Public-domain translations (KJV / WEB / ASV) may eventually be bundled on-device as a build-time asset, but that is a performance / reliability decision, not an offline-reading one.

## Posture

- **Solo individual developer** — Adam Brown. Existing Apple Developer Program enrollment. Will complete Google Play Console identity verification before the 30 September 2026 deadline.
- **App name** — "Tour of the Bible" for now. Open to renaming if a USPTO trademark conflict surfaces, but not blocking.
- **TMBH / Matt Whitman** — existing informal approval ("he's cool with the current project"). A written non-objection email should be sent before mobile launch as a backstop for Apple 5.2 IP review. This is a follow-up, not a cold contact.

---

## What these decisions close from the compliance memo

| Item | Closed by |
|---|---|
| YouVersion AI clause | No AI ever — fully closed |
| YouVersion free-product disclosure clause | Never charging — not triggered |
| Crossway non-commercial trigger (Risk #2 in memo) | Never monetising — ESV stays free tier permanently |
| Apple Guideline 3.1.1 (In-App Purchase) | No purchases — not triggered |
| Google Play Billing requirement | No purchases — not triggered |
| Apple Guideline 5.1.1(v) (account deletion) | No accounts — N/A |
| Google Play account-deletion policy | No accounts — N/A |
| App Privacy nutrition label | "Data Not Collected" achievable (drop Vercel Analytics from mobile) |
| APNs / FCM backend infrastructure | Local notifications only — not needed |

## What stays open

- **Per-Tool YVP Terms for NIV / NIrV / NIVUK** — unknown until Express Bible Licensing runs through the YouVersion Platform Portal. Register `bible-tour-ios` and `bible-tour-android` app records first.
- **YouVersion no-compete clause** — discretionary; mitigated by honest app description at registration and prominent `bible.com` deep-links.
- **Required attributions** — per-translation copyright strings for Credits screen and per-verse display. Operational build work.
- **Crossway 500-verse on-device cache cap** — implement LRU eviction in the verse cache on mobile.
- **kaiserlik/kjv replacement** — rebuild `tagged-verses.json` from `seven1m/open-bibles` + `openscriptures/strongs` before mobile launch. The current source has no LICENSE file.
- **IQ Bible (RapidAPI) removal** — replace `GetBookInfo` / `GetVerseCount` with a static `canon.json`. One afternoon of script work.
- **Vercel Analytics** — remove from mobile clients entirely.
- **Bundle DM Sans + Oswald fonts** — drop `fonts.googleapis.com` runtime dependency from mobile.
- **Privacy Manifest (PrivacyInfo.xcprivacy)** — `CA92.1` UserDefaults reason declaration. Required since May 2024.
- **Google Play Console developer verification** — complete before 30 September 2026.
- **Written non-objection from Matt Whitman** — send before mobile App Store submission.
