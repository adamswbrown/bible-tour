# Tour Mobile App — Licensing & Compliance Checklist

Private working note. Phase-0 gate: **everything in this doc must be cleared before mobile development starts.** A "no" or "unclear" on any item is a stop-the-line event — re-scope or remove the affected feature before continuing.

Owner: Adam
Status: Draft
Last updated: 2026-04-27

---

## 0. Source of truth for the current architecture

This is what we have today. The mobile clients must not regress any of these properties:

- Next.js 16 web app on Vercel.
- Server-side API proxies hide all third-party API keys (`YOUVERSION_API_KEY`, `ESV_API_KEY`).
- Translations: NIV / NIrV / NIVUK via YouVersion Developer API; KJV / WEB / ASV via bible-api.com; ESV text + per-verse audio via Crossway ESV API.
- Strong's lexicon + tagged KJV bundled at build time (Open Scriptures CC BY-SA 3.0; kaiserlik/kjv PD).
- No accounts, no backend, no PII. Progress is `localStorage` only.
- Vercel Analytics on web (must be removed or made opt-in for mobile).

**Mobile rule of thumb:** API keys never leave the server. Mobile clients call our `/v1/*` proxies only.

---

## 1. YouVersion Developer API — NIV / NIrV / NIVUK

This is the highest-risk dependency. NIV rights flow Biblica → YouVersion → us. A web grant does not automatically extend to native apps.

### Action items

- [ ] Re-read the current YouVersion Developer Agreement end-to-end and save a dated PDF copy to `/legal/`.
- [ ] Confirm in writing that the existing Developer key is valid for **iOS and Android native distribution**, not only web.
- [ ] Confirm whether a separate **Biblica license** is required for NIV/NIrV/NIVUK in a native app. If yes, start that process now (Biblica licensing has a multi-week turnaround).
- [ ] Identify any "no competing-with-Bible.com" / "must link back to YouVersion" / "must show YouVersion branding" clauses and design the UI to comply.
- [ ] Confirm the caching policy for licensed text (typically: session-only, no persistent on-device cache, no offline storage of NIV).
- [ ] Confirm the required attribution string per translation and where it must appear (verse footer vs. credits screen vs. both).
- [ ] Confirm rate limits and whether mobile traffic counts against the same quota as web.
- [ ] Get a named contact at YouVersion Developer Relations and log them in `/legal/contacts.md`.

### Open questions to send to YouVersion

1. Does our existing app key cover native iOS and Android distribution, or do we need a separate registration?
2. Are there any required UI elements (logo, "Powered by YouVersion," deep-link to Bible.com) for native apps?
3. What is the maximum permitted on-device cache duration for licensed text?
4. Are there separate quotas / pricing tiers once mobile usage scales?
5. Is offline mode for licensed translations permitted under any circumstances?

### Decision gate

If YouVersion native rights are unclear, ship mobile **without the NIV family** and mark those translations as "web only" until cleared. Do not assume.

---

## 2. Crossway ESV API — text + audio

Generally permissive but has hard numerical limits.

### Action items

- [ ] Re-read the current Crossway API Terms of Use; save dated PDF.
- [ ] Confirm native iOS and Android distribution is permitted under the existing key (it generally is).
- [ ] Verify the per-query and per-app limits we must enforce in the proxy:
  - ≤ 5,000 verses per query
  - ≤ half of any one book per query
  - No complete book in a single query
  - No complete book across queries by the same user
- [ ] Confirm **audio caching policy**. Historically: streaming only, no persistent download. Design the player as streaming-only and disable any system-level download affordances.
- [ ] Confirm required copyright string for ESV text and ESV audio; render in Credits screen and adjacent to the verse where required.
- [ ] Confirm rate limits and whether to request a higher tier for mobile traffic.
- [ ] If we ever add donation / paid features, re-check whether commercial use changes terms (it does — would require a different license).

### Decision gate

ESV is low-risk. Main thing is enforcing the verse-count limits server-side in the proxy so a malicious or buggy client cannot exceed them.

---

## 3. bible-api.com — KJV / WEB / ASV

Public-domain text via a free third-party service. Risk is **availability**, not licensing.

### Action items

- [ ] Re-read bible-api.com terms; save dated PDF.
- [ ] Confirm native app usage is permitted (it is, but verify wording).
- [ ] Confirm or measure current rate limits.
- [ ] Decide on a fallback: if bible-api.com is down or rate-limits us, do we (a) bundle PD translations on-device, (b) self-host a mirror, or (c) degrade gracefully? Recommendation: **(a) bundle PD text** — it's small, fully legal, and removes a runtime dependency for the offline story.
- [ ] If we bundle PD text on-device, document the source repo, commit hash, and license per translation in `DATA-SOURCES.md`.

### Decision gate

Low-risk. The action item that matters is bundling PD translations so we stop depending on a free service for offline mode.

---

## 4. Open Scriptures Strong's dictionaries — CC BY-SA 3.0

Already attributed in the web app. Mobile must preserve this.

### Action items

- [ ] Render the existing attribution in the mobile Credits screen:
      "Strong's dictionary from Open Scriptures (CC BY-SA 3.0)"
- [ ] Link to the CC BY-SA 3.0 license text from the Credits screen.
- [ ] Confirm our bundled subset (`lexicon.json`) ships under CC BY-SA 3.0 (it does — share-alike is inherited).
- [ ] Add a note to the app's "Open Source Licenses" screen calling out that the lexicon data is share-alike and any forks must preserve the same terms.

### Decision gate

Cleared as long as attribution + license link ship in the app.

---

## 5. kaiserlik/kjv — public domain

### Action items

- [ ] Credit kaiserlik/kjv as the source of the tagged KJV in the Credits screen (not legally required; courtesy).
- [ ] Pin the commit hash in `scripts/build-tagged-verses.mjs` so builds are reproducible.

### Decision gate

Cleared.

---

## 6. Trademark & brand hygiene

The current web app already carries the disclaimer "Not affiliated with or endorsed by The Ten Minute Bible Hour." Mobile must do the same and avoid anything that could read as endorsement.

### Action items

- [ ] Run a USPTO TESS search for "Tour of the Bible," "Lightning-Fast Field Guide," and "Ten Minute Bible Hour."
- [ ] Confirm we do not use any TMBH logos, color marks, or stylized wordmarks.
- [ ] Render the "Not affiliated…" disclaimer in:
  - App Store / Play Store description
  - In-app About screen
  - Onboarding (first launch) screen
- [ ] If we want to use Matt Whitman's name or likeness in marketing copy, get written permission and store it in `/legal/`.
- [ ] Decide on a final app store display name. "Tour of the Bible" is fine if no conflicting trademark surfaces; otherwise pick a neutral name and use the tour framing only in the description.

### Decision gate

Trademark conflict on "Tour of the Bible" → rename before submission. Anything else → mitigate with disclaimer.

---

## 7. Apple App Store readiness

### Developer account

- [ ] Apple Developer Program enrollment ($99/yr). Decide individual vs. organization (org requires DUNS; recommend org if there's any chance of a team).
- [ ] Two-factor auth enforced on the Apple ID.
- [ ] App Store Connect roles assigned (Account Holder, Admin, Developer at minimum).

### Guideline-specific items

- [ ] **4.2 Minimum Functionality** — ship at least three native-only features so the app is not a web wrapper:
  - Background audio with lock-screen / Control Center transport controls
  - Offline mode for PD translations + lexicon + reading plan
  - Native share sheet, haptics on check-off, Dynamic Type, system dark mode
- [ ] **5.1.1 Privacy** — privacy policy URL live before submission.
- [ ] **5.1.1(v) Account Deletion** — N/A while we stay account-less. Document in submission notes: "App does not collect user accounts."
- [ ] **5.1.2 Data Use & Sharing** — App Privacy nutrition label. Target answer: "Data Not Collected." If we keep server-side request logging on the proxy, disclose IP-address handling.
- [ ] **5.2 Intellectual Property** — TMBH disclaimer + bible publisher attributions + lexicon attribution.
- [ ] **3.1.1 In-App Purchase** — N/A unless/until we monetize. If we add donations or premium features, digital goods must use Apple IAP. Do not add Stripe / PayPal links for digital purchases.
- [ ] **Privacy Manifest** (`PrivacyInfo.xcprivacy`) — declare required-reasons APIs (`UserDefaults` reason `CA92.1` is typical). Required since May 2024.
- [ ] **App Tracking Transparency** — not needed as long as we don't track across apps. Keep it that way.
- [ ] **Age rating** — 4+. Religious / Reference category.
- [ ] **Export compliance** — uses only standard HTTPS encryption; declare exempt.

### Submission assets

- [ ] 1024×1024 app icon.
- [ ] Screenshots: 6.7" iPhone, 6.1" iPhone, 12.9" iPad (3–10 each).
- [ ] App preview video (optional).
- [ ] App Store description (4,000 char), promotional text (170 char), keywords (100 char), support URL, marketing URL, privacy policy URL.
- [ ] What's New text for first release.

---

## 8. Google Play readiness

### Developer account

- [ ] Google Play Console registration ($25 one-time).
- [ ] Identity verification (required for new accounts since 2024). Org accounts need DUNS; individual accounts need government ID.
- [ ] Two-factor auth enforced on the Google account.

### Policy-specific items

- [ ] **Target API level** — current minimum (API 34 in 2025; will rise to 35). Verify before each submission.
- [ ] **Data safety form** — mirror the Apple privacy answers.
- [ ] **Account deletion** — N/A while account-less; note in policy declaration.
- [ ] **Payments** — same rule as Apple: digital goods via Play Billing only. No external payment links for digital content.
- [ ] **Permissions justification** — minimize. Only request `INTERNET`. No location, no contacts, no storage.
- [ ] **Content rating** — IARC questionnaire. Target Everyone.
- [ ] **Sensitive permissions** — none requested. Document in store listing.
- [ ] **Families policy** — opt out unless we explicitly target children (we don't).

### Submission assets

- [ ] 512×512 high-res icon.
- [ ] Adaptive icon (foreground + background layers).
- [ ] Feature graphic 1024×500.
- [ ] Phone screenshots (2–8) and tablet screenshots if we support tablets.
- [ ] Short description (80 char), full description (4,000 char), support email, privacy policy URL.

---

## 9. Privacy & data handling

The current "no accounts, no tracking" posture is our biggest compliance asset. Protect it.

### Action items

- [x] Drop Vercel Analytics from the mobile build, OR replace with privacy-first analytics that is **off by default** with an explicit opt-in toggle in Settings. _(Audited 2026-04-28: no `@vercel/analytics` import or `track()` call anywhere in `mobile/`. Web app retains it; mobile is a separate Expo workspace and was never wired up.)_
- [ ] Decide on crash reporting: none, Sentry, or EAS. If used, disclose in both store privacy labels and the privacy policy.
- [ ] Audit the Vercel proxy logs: how long are IP addresses retained? Disclose in the privacy policy.
- [ ] Privacy policy must cover:
  - What we collect (ideally: nothing on-device beyond progress in local storage; server-side request logs for abuse prevention)
  - Third parties our requests touch (YouVersion, Crossway, bible-api.com)
  - Children's data (we don't knowingly collect)
  - Contact email for data requests
  - Change-log of policy revisions
- [ ] Terms of Use covering: licensed-text restrictions ("you may not redistribute"), acceptable use, disclaimer of warranty.
- [ ] Host both at stable URLs we control (e.g. `bible-tour.vercel.app/privacy`, `/terms`) — the URLs go in both store listings.

---

## 10. Operational readiness before submission

### Action items

- [ ] API key rotation runbook documented in `/ops/`.
- [ ] Quota monitoring + alerting on the Vercel proxies (Crossway and YouVersion both rate-limit).
- [ ] Versioned proxy contract: `/v1/verse`, `/v1/verse-esv`, `/v1/verse-audio`. Mobile only calls `/v1/*`.
- [ ] Server-side enforcement of Crossway per-query limits so a misbehaving client cannot exceed them.
- [ ] Crash / error budget plan: how do we know if mobile is broken in the field?
- [ ] Support email monitored at least weekly (Apple and Google both check).

---

## 11. Final go / no-go gate

Mobile development does not start until every item in **Sections 1–6** is ✅ or explicitly scoped out, and every item in **Sections 7–10** is on a tracked plan with an owner.

Single biggest unknown today: **YouVersion native-app rights for the NIV family.** Resolve that first; the rest of the checklist is mechanical.
