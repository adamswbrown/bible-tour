# LinkedIn Post — Tour of the Bible

Shipped a small side project I'm proud of: **Tour of the Bible** — a web
companion for Matt Whitman's *Lightning-Fast Field Guide to the Bible*, a
reading plan that walks through all 66 books in about 90 minutes of reading.

🔗 bible-tour.vercel.app

A quick note before the tech: I know faith topics can be sensitive on
LinkedIn, so I want to be clear this post is about the craft of building
the thing. Whether the source material resonates with you personally is
entirely your call — I just wanted to share a project that was genuinely
fun to build.

**What it does**
• A checklist across all 66 books with curated verse references
• An inline verse reader — tap any reference and read the passage without
  leaving the page
• Multiple translations: NIV / NIrV / NIVUK via the YouVersion Developer
  API, plus KJV / WEB / ASV via bible-api.com
• An "Eagle Method" study flow broken into three stages — Survey, Map,
  and Current — that surfaces book context, chapter maps, and summaries
• No accounts, no database, no tracking — progress lives entirely in
  localStorage

**The stack**
• Next.js 16 (App Router) on Vercel
• Server-side API proxy so the YouVersion app key never touches the client
• Two layers of caching — Next.js Data Cache + Vercel Edge CDN with
  stale-while-revalidate. Bible verses don't change, so after the first
  fetch every subsequent reader is served from the edge
• Built pair-programming style with Claude (Anthropic)

**Credits — this part matters**
• The reading plan and the framing of the tour come from Matt Whitman's
  *Lightning-Fast Field Guide to the Bible*
  (thetmbh.com/tourofthebible). The Eagle Method study structure is also
  his work. Full credit to Matt for the idea — I just built a digital
  companion for his plan.
• **Not affiliated with or endorsed by The Ten Minute Bible Hour.** I'm a
  fan, not a partner.
• Licensed translations via the YouVersion Developer Platform; public
  domain translations via bible-api.com
• Chapter summary dataset attributed in-app

If the technical side is interesting to you — caching strategies for
effectively immutable content, working around a licensed third-party API,
or shipping a single-page Next.js app with no UI library — I'd love to
compare notes.

#SideProject #NextJS #Vercel #WebDev
