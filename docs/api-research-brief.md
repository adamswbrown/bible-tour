# Tour of the Bible — API Research Brief

Self-contained brief for a research agent. Goal: produce a compliance memo for each external API the app depends on, so we can decide what is shippable in iOS / Android native clients.

---

## Project context (read this first)

- **App**: "Tour of the Bible" — companion to Matt Whitman's *Lightning-Fast Field Guide to the Bible*. Reading checklist over all 66 books with per-verse text + audio. Web app live at https://bible-tour.vercel.app.
- **Affiliation**: explicitly **not** affiliated with or endorsed by The Ten Minute Bible Hour.
- **Today's stack**: Next.js 16 on Vercel. Server-side API proxies hide all third-party keys. No accounts, no backend database, progress in `localStorage` only.
- **Goal of this research**: ship the same product as native iOS and Android apps that comply with every upstream API's terms **and** Apple App Store + Google Play policies.
- **Monetization today**: none. Plan is to stay free and ad-free at launch; donations / "pro" features may be considered later.
- **Legal entity**: individual developer (Adam Brown).

For each API below, answer the **research questions** verbatim and produce the **deliverables** at the end of this brief.

---

## API 1 — YouVersion Developer API

**Highest-priority dependency. The single biggest unknown for the mobile project.**

- **Host**: `api.youversion.com`
- **Endpoint pattern**: `https://api.youversion.com/v1/bibles/{bibleId}/passages/{usfm}`
- **Auth**: `X-YVP-App-Key` header, key from `YOUVERSION_API_KEY`
- **Translations consumed**: NIV, NIrV, NIVUK (rights flow Biblica → YouVersion → us)
- **Used by**: `app/api/verse/route.js`
- **Caching today**: Next.js Data Cache 7 days + Vercel Edge CDN 7 days with stale-while-revalidate
- **Developer portal**: https://developers.youversion.com/

### Research questions

1. Does the current YouVersion Developer Agreement permit redistribution of licensed Bible text in **third-party native iOS and Android apps**, or only on the web?
2. Is a separate **Biblica license** required to ship NIV / NIrV / NIVUK in a native app, even when the API key is valid? What is Biblica's licensing process and turnaround time?
3. What attribution / branding is required in a native app (e.g. "Powered by YouVersion," logo, deep link back to Bible.com)? Where must it appear (per-verse, screen footer, credits screen)?
4. What is the maximum allowed on-device cache duration for licensed text? Is offline mode ever permitted for NIV-family translations?
5. Are there clauses prohibiting apps that "compete with" Bible.com / the YouVersion app? How is "compete" defined?
6. What rate limits apply, and does mobile traffic share quota with the existing web key, or do we need a separate registration?
7. Are there clauses governing use of YouVersion data in AI / ML training, summarization, or generative features?
8. Is there a named developer-relations contact for licensing escalations?

### Deliverables

- Verbatim quote of every clause that affects native distribution, caching, attribution, branding, competition, and AI use.
- Yes / no / conditional answer to each numbered question above.
- Direct link to the current Developer Agreement + a saved PDF copy.
- Estimated calendar time to obtain any additional licenses (Biblica) if required.

---

## API 2 — Crossway ESV API (text)

- **Host**: `api.esv.org`
- **Endpoint**: `https://api.esv.org/v3/passage/text/?...`
- **Auth**: bearer token from `ESV_API_KEY`
- **Used by**: `app/api/verse-esv/route.js`
- **Developer portal**: https://api.esv.org/

### Research questions

1. Does the current ESV API ToS permit native iOS and Android apps to display ESV passage text via the API?
2. What are the exact per-query and per-app limits? (Historically: ≤ 5,000 verses per query, ≤ ½ of any one book, no complete book, no complete book across queries by the same user — confirm current values.)
3. Required copyright / attribution string for ESV text and required placement.
4. Is on-device caching of ESV text permitted? For how long?
5. Does the free / non-commercial tier remain available if we ever (a) accept donations, (b) sell a paid feature, (c) display advertising? At what point does it become commercial use?
6. Are there clauses governing use of ESV text in AI / ML training, summarization, or generative features?
7. Are mobile native apps subject to a separate registration or a higher-quota tier?

### Deliverables

- Verbatim quote of every clause covering native distribution, caching, attribution, commercial use, and AI use.
- Numerical confirmation of current per-query and per-app limits.
- Yes / no / conditional answer to each numbered question above.
- Direct link to current ToS + saved PDF copy.

---

## API 3 — Crossway ESV API (audio)

- **Host**: `api.esv.org`
- **Endpoint**: `https://api.esv.org/v3/passage/audio/?...`
- **Auth**: same `ESV_API_KEY` as text
- **Used by**: `app/api/verse-audio/route.js`
- **Format**: per-verse audio narration

### Research questions

1. Are there terms specific to the audio API distinct from the text API?
2. Is **persistent download / offline storage** of audio permitted? (Historically: streaming-only — confirm current language.)
3. Required copyright / attribution string for audio playback (in-app credit, lock-screen metadata, etc.).
4. Background audio playback in a mobile app: any specific restrictions (e.g. lock-screen controls, AirPlay, CarPlay, Android Auto)?
5. Same commercial-use trigger questions as the text API: donations, paid features, ads.
6. Rate limits on audio specifically.

### Deliverables

- Same format as API 2 — verbatim clauses, yes/no/conditional answers, dated PDF.

---

## API 4 — bible-api.com

- **Host**: `bible-api.com`
- **Endpoint**: `https://bible-api.com/{query}`
- **Auth**: none (unauthenticated)
- **Translations consumed**: KJV, WEB, ASV (all public domain)
- **Used by**: `app/lib/translations.js`

### Research questions

1. Does bible-api.com publish formal terms of use? Where?
2. Are native mobile apps explicitly permitted? Is there an SLA, rate limit, or fair-use cap?
3. Operator: who runs it, and what is the funding model? What is the failure / shutdown risk over 1–3 years?
4. **Recommended fallback strategy**: bundle PD translations on-device so we are not at the mercy of a free third-party service. Identify clean PD source repos for KJV, WEB, ASV (commit hash, license file, file format) that we could vendor into the app at build time.

### Deliverables

- Link to current ToS (or note "no formal ToS published" if so).
- Operator identity + funding model summary.
- Three candidate source repos for bundling PD translations on-device, with license verification and recommended choice.

---

## API 5 — IQ Bible (RapidAPI)

**Not in the original `DATA-SOURCES.md`. Discovered during code audit.**

- **Host**: `iq-bible.p.rapidapi.com`
- **Auth**: `x-rapidapi-key` + `x-rapidapi-host` headers, key from `IQ_BIBLE_API_KEY`
- **Endpoints used**: `GetBookInfo`, `GetVerseCount`
- **Used by**: `app/lib/iq-bible.js`, called from `app/eagle/[book]/page.js` (Eagle book pages)
- **Purpose**: book-level metadata and verse counts
- **Marketplace**: RapidAPI listing — search "IQ Bible"

### Research questions

1. RapidAPI imposes its own ToS on top of the underlying API provider's terms. Pull both:
   - RapidAPI platform Terms of Service
   - IQ Bible provider's listing terms / pricing tier conditions
2. Does the current free or paid tier permit use in **native mobile apps** distributed publicly?
3. Is there a commercial-use trigger (donations, paid features, ads) that bumps us to a higher tier?
4. What are the current rate limits per pricing tier?
5. Is the data IQ Bible returns (book metadata, verse counts) **factual / public-domain data** that we could replace with a local dataset to remove the dependency entirely? If yes, identify a candidate source.
6. Provider identity: who runs IQ Bible, and what is the failure / shutdown risk?

### Deliverables

- Verbatim relevant clauses from both RapidAPI ToS and the IQ Bible listing.
- Yes / no / conditional answer to questions 2–4.
- Recommendation: keep, replace with a free static dataset, or drop the feature.

---

## Build-time data dependencies (bundled into the app)

These are not runtime APIs but are baked into the binary at build time. Compliance still applies.

### kaiserlik/kjv

- **URL**: https://github.com/kaiserlik/kjv (raw fetched from `raw.githubusercontent.com/kaiserlik/kjv/master/...`)
- **Pulled by**: `scripts/build-tagged-verses.mjs`
- **License**: public domain (KJV text PD; Strong's numbers PD)
- **Output**: `app/data/tagged-verses.json` (~143 KB, 234 verses, ~1,500 Strong's tags)

**Research questions**

1. Confirm the repo's license file and that no upstream contributor has added restrictive terms.
2. Pin the commit hash we currently consume so future builds are reproducible.

### Open Scriptures Strong's (Hebrew + Greek)

- **URLs**:
  - https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js
  - https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js
- **Pulled by**: `scripts/build-lexicon.mjs`
- **License**: CC BY-SA 3.0 (share-alike — derivatives must keep the same license)
- **Output**: `app/data/lexicon.json` (~339 KB, 1,029 pruned entries)

**Research questions**

1. Confirm the exact attribution wording required by Open Scriptures.
2. Confirm that bundling our pruned subset under CC BY-SA 3.0 is consistent (it is) and that we can ship the bundle as part of a closed-source mobile app as long as the lexicon data itself remains accessible under the same license.
3. Identify whether the App Store and Play Store binary distribution counts as "distribution" for share-alike purposes (yes) and what we must publish to comply (typically: a Credits screen + license text + source link).

---

## Telemetry, fonts, and infrastructure (mobile compliance angle)

These don't have user-facing terms most people read, but they do show up in Apple's App Privacy nutrition label and Google Play's Data Safety form.

### Vercel Analytics

- **SDK**: `@vercel/analytics/next`, imported in `app/layout.js`
- **Mobile decision**: drop entirely OR replace with privacy-first analytics that is **off by default with explicit opt-in toggle**.

**Research questions**

1. What does Vercel Analytics actually collect (IP, user agent, page path, anything else)?
2. Does Vercel publish a sub-processor list and data retention period?
3. If we keep it, what are the exact disclosures required for App Privacy and Data Safety?

### Google Fonts (DM Sans, Oswald)

- **Loaded from**: `fonts.googleapis.com`, `fonts.gstatic.com`
- **Mobile compliance angle**: every page load forwards user IP to Google. Easy to self-host or bundle the fonts into the app and remove the dependency entirely.

**Research questions**

1. Confirm that bundling DM Sans (Open Font License) and Oswald (Open Font License) into a closed-source app is permitted under the OFL — it is, but verify and produce the attribution string.

### Vercel Edge / Functions (API proxies)

- **What they do**: serve `/api/verse*` and add API keys server-side.
- **Compliance angle**: server-side request logs include IP. Must disclose in privacy policy.

**Research questions**

1. What is Vercel's default log retention period for serverless function invocations on the current plan?
2. Can log retention or IP capture be reduced or disabled for the privacy policy story?

---

## Outbound links present in the UI (trademark / IP scan only)

These are not API calls, but Apple's 5.2 IP review and Google's IP policy will inspect the app for unauthorized brand use. Confirm we have rights or fair-use justification for each.

| Domain | Where used | Purpose |
|---|---|---|
| `bible.com` | `app/lib/translations.js` | Deep-link to YouVersion reader (likely required by their terms) |
| `blueletterbible.org` | `app/components/LexiconDrawer.js` | Cross-reference link |
| `en.wikipedia.org` | book metadata | Per-book Wikipedia link |
| `youtube.com`, `youtu.be` | Eagle pages | Embedded video links |
| `crossway.org` | footer / about | Attribution |
| `thetmbh.com` | footer / about | Reference to Matt Whitman's site |
| `askadam.cloud` | footer / about | Adam's personal site |

**Research questions**

1. Does any link or text use a third-party logo, wordmark, or stylized brand element we don't have rights to?
2. Is the existing "Not affiliated with or endorsed by The Ten Minute Bible Hour" disclaimer sufficient under nominative fair use, or should we obtain a written non-objection from Matt Whitman / TMBH before mobile launch?

---

## App Store + Play Store policy items the research should also cover

These are the policies that matter for shipping; pull the most current text and flag anything that has changed in the last 12 months.

### Apple App Store

- **App Review Guidelines** — current full text. Flag changes since 2025.
- **Specific guidelines to quote**: 4.2 (minimum functionality), 4.7 (HTML5 mini-apps), 5.1 (privacy), 5.1.1(v) (account deletion — N/A but document), 5.1.2 (data use), 5.2 (intellectual property), 5.6 (developer code of conduct), 3.1.1 (in-app purchase), Privacy Manifest requirements.
- **Required Reasons API** — current list and the reason codes that apply to a Bible-reading app (likely just `UserDefaults` reason `CA92.1`).
- **App Privacy nutrition label** — exact answer matrix for an app that collects nothing beyond local progress and proxies third-party APIs.

### Google Play

- **Developer Program Policies** — current full text.
- **Target API level requirement** for new app submissions in the next 12 months.
- **Data Safety** form — exact answer matrix.
- **Account deletion policy** — confirm that "no accounts" qualifies for the policy declaration.
- **Identity verification** requirements for new individual developer accounts (in effect since 2024).

---

## Final deliverables checklist

The research agent should produce a single memo (`docs/api-compliance-memo.md` or equivalent) containing:

- [ ] One section per API (1–5 above) with verbatim clauses, yes/no/conditional answers, and dated PDFs of source ToS.
- [ ] One section per build-time data source (kaiserlik/kjv, Open Scriptures) with attribution wording and pinned commit hashes.
- [ ] One section on telemetry / fonts / infra with disclosure language ready to drop into the privacy policy.
- [ ] One section on outbound link / trademark hygiene with go / no-go per domain.
- [ ] One section on Apple App Store + Google Play current policy with the specific clauses we must comply with.
- [ ] **Ranked risk register**: every issue identified, ordered by severity (project-killing → minor), with the mitigation we'd need to ship.
- [ ] **Go / no-go recommendation per translation**: for each of NIV, NIrV, NIVUK, ESV, KJV, WEB, ASV — can we ship it in a native iOS / Android app, and under what conditions?
- [ ] **Outreach drafts**: ready-to-send emails for YouVersion Developer Relations, Biblica licensing (if needed), Crossway API support, and IQ Bible / RapidAPI.

The single biggest open question is API 1 (YouVersion + Biblica native rights). The rest is tractable. If API 1 comes back negative, the fallback is shipping mobile with PD translations and ESV only.
