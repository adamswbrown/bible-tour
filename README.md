# Tour of the Bible

A web companion for Matt Whitman's *Lightning-Fast Field Guide to the Bible* — taste every book of the Bible in 90 minutes. Track your progress through all 66 books with key verse references for each.

**Not affiliated with or endorsed by The Ten Minute Bible Hour.**

Live at [bible-tour.vercel.app](https://bible-tour.vercel.app)

## What it does

- Reading checklist covering all 66 books with curated verse references
- Inline verse reader — tap any reference to read the passage without leaving the app
- Multiple translations: NIV, NIrV, NIVUK (via YouVersion API), KJV, WEB, ASV (via bible-api.com)
- Progress saved in localStorage (no backend, no accounts, no tracking)

## Tech stack

- **Next.js 16** (App Router) on **Vercel**
- Single-page app — one `page.js`, no external UI libraries
- **YouVersion Developer API** for licensed translations (NIV family)
- **bible-api.com** for public domain translations (KJV, WEB, ASV)
- All user data in `localStorage` — no database

## Setup

```bash
npm install
npm run dev
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `YOUVERSION_API_KEY` | App key from [YouVersion Developer Platform](https://developers.youversion.com/overview) |

Create a `.env.local` file:

```
YOUVERSION_API_KEY=your_key_here
```

## Project structure

```
app/
  page.js          # Entire UI — login, checklist, verse panel
  layout.js        # Root layout with metadata
  api/
    verse/
      route.js     # Server-side proxy to YouVersion API (keeps key secret)
```

## How the verse API works

`/api/verse` proxies requests to `https://api.youversion.com/v1/bibles/{id}/passages/{usfm}` with the API key in the `X-YVP-App-Key` header. Responses are cached at two levels:

1. **Next.js Data Cache** — upstream fetch cached for 7 days across serverless invocations
2. **Vercel Edge CDN** — responses cached at edge for 7 days with stale-while-revalidate

Bible verses don't change, so after the first request for any verse+translation combo, subsequent requests are served from cache without hitting YouVersion or even the serverless function.

## Licensed translations

The YouVersion API key is licensed for specific Bible versions. Currently licensed English translations:

- NIV (111) — New International Version 2011
- NIrV (110) — New International Reader's Version 2014
- NIVUK (113) — New International Version Anglicised 2011

Unlicensed copyrighted translations (NKJV, NLT, CSB, MSG) link out to YouVersion instead of displaying inline.

## Credits

- Reading plan from Matt Whitman's [Lightning-Fast Field Guide to the Bible](https://www.thetmbh.com/tourofthebible)
- [Watch Matt explain the tour](https://youtu.be/XdMuZCTChJE?si=DRfBFUnDc2mt3Yq2)
- Built by [Adam Brown](https://askadam.cloud/) & Claude
