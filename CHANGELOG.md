# Changelog

All notable user-facing changes to Tour of the Bible.

This project ships continuously to [bible-tour.vercel.app](https://bible-tour.vercel.app)
and doesn't follow semver — entries are grouped under the date they shipped
to production. Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## 2026-04-26

### Added
- ESV reading translation via the Crossway API. Slots into the translation
  picker alongside the NIV family and renders inline with the required
  Crossway citation. ([#18](https://github.com/adamswbrown/bible-tour/pull/18))
- Per-verse audio playback (ESV narration) via the Crossway API. An inline
  `<audio>` element appears in the verse panel for every structured
  reference and streams MP3 directly from Crossway's CDN.
  ([#16](https://github.com/adamswbrown/bible-tour/pull/16))
- "ESV Audio" pill on the audio player so the audio-translation contract
  stays clear when the user picks a different reading translation.
  ([#17](https://github.com/adamswbrown/bible-tour/pull/17))

### Changed
- Toggling **Originals** on now auto-switches the translation picker to KJV
  so the tagged Strong's tokens render inline in the main verse text.
  Previously the originals rendered in a separate section beneath the
  user's chosen translation, which read as broken on non-KJV translations.
  ([#19](https://github.com/adamswbrown/bible-tour/pull/19))
- ESV passages omit inline `[N]` verse markers — the verse range shown in
  the panel header is the canonical reference, so the markers were
  redundant. ([#20](https://github.com/adamswbrown/bible-tour/pull/20))
- README updated to document the Crossway integration end-to-end and the
  new Originals auto-switch behaviour.
  ([#21](https://github.com/adamswbrown/bible-tour/pull/21))

### Configuration
- New environment variable `ESV_API_KEY` powers both `/api/verse-esv`
  (text) and `/api/verse-audio` (audio). Set it in `.env.local` for local
  dev and in Vercel project settings (Production scope) for the live site.
