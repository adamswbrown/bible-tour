# App Store listing copy

Drafts for App Store Connect. Paste each block into the matching field.
Lengths shown are Apple's hard limits.

---

## App name (30 char)

```
Tour of the Bible
```
*(17 chars — well under the limit. Leaves room to A/B test "Tour of the Bible: Reading Plan" or "Bible Tour" as a shorter sibling.)*

## Subtitle (30 char)

```
Read every book in 90 minutes
```
*(28 chars. Sells the value prop in plain language.)*

## Promotional text (170 char, can be edited without resubmission)

```
A taste of every book of the Bible — 66 short readings, ten translations, ESV audio, and a tappable Hebrew/Greek lexicon. No accounts, no ads, no tracking.
```

## Keywords (100 char, comma-separated, no spaces)

```
bible,reading,plan,scripture,niv,esv,kjv,strongs,hebrew,greek,devotional,study,tour,checklist
```
*(96 chars. Avoid "the" and other stop words; Apple's search ignores them anyway.)*

## App description (4000 char)

```
Tour of the Bible is a companion to Matt Whitman's "Lightning-Fast Field Guide to the Bible" — taste every book of the Bible in about 90 minutes, then come back as often as you like.

WHAT YOU GET

• A reading plan covering all 66 books with curated verse references for each.
• Inline verse text in ten translations: KJV, NIV, NIrV, NIVUK, ESV, NKJV, NLT, CSB, MSG, WEB, ASV. Tap any reference to read it without leaving the app. Switch translations from inside any passage.
• Per-verse ESV audio narration. Plays in the background and through your phone speaker, AirPods, or CarPlay.
• An "Originals" mode that shows the KJV with each Hebrew or Greek word highlighted in yellow. Tap any highlighted word to see its Strong's lexicon entry — part of speech, gloss, and full Hebrew or Greek definition.
• Progress tracking: tick books off as you read them. Reset anytime.
• Optional gentle daily reminder. No marketing, no streaks, no guilt — just a nudge.

WHAT YOU DON'T GET

• No account. Nothing to sign up for, nothing to remember.
• No tracking. The mobile app contains zero analytics SDKs and no advertising identifiers.
• No ads.
• No paywall. Free to use, forever.

HOW IT WORKS

The reading plan was originally published in Matt Whitman's "Lightning-Fast Field Guide to the Bible." Each book on the list points at one to four short verse references — a handful of passages that capture what that book is about. Tap a reference, read it (or listen to it), tap the checkbox when you're done. Sixty-six taps later, you've taken a guided tour through the whole Bible.

The translation switcher inside each passage means you can read the same verse in NIV first, then KJV, then ESV — no need to leave the app or copy and paste.

ATTRIBUTION

NIV / NIrV / NIVUK passages: Holy Bible, New International Version®, NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.

ESV passages and audio: Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.

KJV, WEB, ASV: public domain.

Strong's Hebrew and Greek dictionaries: © 2009–2010 Open Scriptures. Licensed under Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0).

Tour of the Bible is not affiliated with or endorsed by The Ten Minute Bible Hour.

PRIVACY

Your reading progress is stored on your own device — never sent to any server. The app does not require an account, does not contain advertising, and does not track you. The full privacy policy lives at bible-tour.vercel.app/privacy.

QUESTIONS / FEEDBACK

bibletour@askadam.cloud — replies are best-effort from one human and usually arrive within a few days.
```

*(~3,200 chars. Room to expand if needed.)*

## What's New (4000 char, per release)

```
v1.0 — initial release.

The whole tour: a reading plan covering every book of the Bible, with curated verse references for each. Tap to read in your translation of choice, listen to per-verse ESV audio, or switch on Originals mode to study the underlying Hebrew and Greek with a tappable Strong's lexicon.

No accounts. No tracking. No ads.
```

## Support URL

```
https://bible-tour.vercel.app/support
```

## Marketing URL (optional)

```
https://bible-tour.vercel.app
```

## Privacy Policy URL

```
https://bible-tour.vercel.app/privacy
```

## Copyright (App Store Connect "Copyright" field, plain text)

```
© 2026 Adam Brown
```

## Trade representative contact (only if you want to opt out of trade-rep visibility, otherwise leave blank)

Leave blank unless you specifically want a public trade-rep on the listing.

## Age rating questionnaire — recommended answers

Apple infers the age rating from the IARC questionnaire. Recommended answers given the actual content:

- Cartoon or fantasy violence: **None**
- Realistic violence: **None**
- Prolonged graphic or sadistic realistic violence: **None**
- Profanity or crude humor: **None**
- Mature/suggestive themes: **Infrequent/Mild** (some Old Testament passages reference sexual content or violence; better to be conservative here than rejected)
- Horror/fear themes: **None**
- Medical/treatment information: **None**
- Alcohol, tobacco, or drug use: **None**
- Sexual content or nudity: **Infrequent/Mild** (same reasoning as mature themes)
- Gambling: **None**
- Unrestricted web access: **No**
- Gambling and contests: **No**

Expected resulting rating: **12+**.

(If the questionnaire ends up at 9+, that's fine too. Don't push for 4+ — there are passages in the Old Testament that aren't appropriate for very young children, and a 4+ app caught with mature content gets removed.)

## Categories

- Primary: **Reference**
- Secondary: **Lifestyle** (or **Education**)

Reference is the cleanest match — Bible-reading apps overwhelmingly land there. Lifestyle is a reasonable secondary because the tour framing is more devotional than academic.

## Pricing

- Price: **Free** (no IAP)
- Availability: **All countries / regions** unless there are specific places you'd rather not appear

## App Privacy nutrition label answers

Use these answers in App Store Connect → App Privacy. Every section is the same:

| Category | Collected? |
|---|---|
| Contact Info | No |
| Health & Fitness | No |
| Financial Info | No |
| Location | No |
| Sensitive Info | No |
| Contacts | No |
| User Content | No |
| Browsing History | No |
| Search History | No |
| Identifiers | No |
| Purchases | No |
| Usage Data | No |
| Diagnostics | No |
| Other Data | No |

If you later add Sentry / Crashlytics / similar, change "Diagnostics" to **Yes → Crash Data, linked to no identifiers, not used for tracking**.

## Promotional screenshots

Required sizes (Apple takes the largest of each device class and downsamples for smaller displays):

- 6.7" iPhone (iPhone 15 Pro Max / 16 Pro Max): 1290 × 2796
- 6.1" iPhone (iPhone 15 / 16): 1179 × 2556 (only required if 6.7" has notable layout differences)
- 12.9" iPad Pro: 2048 × 2732 (only required if `supportsTablet: true`, which we have)

Suggested screens to capture:
1. Tour tab with the progress card and a few books checked off
2. Verse modal showing NIV passage with translation pills and audio bar
3. Verse modal in Originals mode with a Strong's word selected (lexicon drawer half-up)
4. Lexicon drawer fully expanded showing a Hebrew/Greek entry
5. Settings / About screen showing translations and credits
