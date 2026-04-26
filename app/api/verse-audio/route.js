import { API_BOOK_NAMES } from "../../lib/bible";

// Proxies the ESV API passage/audio endpoint.
//
// ESV returns a 302 with a Location header pointing at an MP3 on Crossway's CDN.
// We forward that redirect to the client (with our own Cache-Control), so the
// browser's <audio> element fetches the MP3 directly from Crossway.
//
// Why this shape and not streaming the MP3 through us:
//   - Smaller serverless payload (no audio bytes pass through the function).
//   - Vercel Edge caches the redirect response for 7 days; cold-path latency
//     is one ESV API call, then the browser hits Crossway directly.
//   - The MP3 URL Crossway returns is stable for a given passage, so a cached
//     redirect stays valid.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get("book");
  const ref = searchParams.get("ref");

  if (!book || !ref) {
    return new Response("Missing book or ref", { status: 400 });
  }

  const apiKey = process.env.ESV_API_KEY;
  if (!apiKey) {
    return new Response("API not configured", { status: 500 });
  }

  // ESV's parser prefers "1 Samuel" over "I Samuel"; reuse the same name map
  // we already use for bible-api.com queries.
  const apiBookName = API_BOOK_NAMES[book] || book;
  const passage = `${apiBookName} ${ref}`;
  const upstream = `https://api.esv.org/v3/passage/audio/?q=${encodeURIComponent(passage)}`;

  let res;
  try {
    res = await fetch(upstream, {
      headers: { Authorization: `Token ${apiKey}` },
      redirect: "manual",
    });
  } catch {
    return new Response("Request failed", { status: 502 });
  }

  const location = res.headers.get("location");
  if (!location) {
    return new Response("Audio not found", { status: res.status || 404 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      // Browsers cache 1 day, Vercel edge caches 7 days, then SWR for a day.
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
