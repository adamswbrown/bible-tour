import { API_BOOK_NAMES } from "../../lib/bible";

// Proxies the ESV API passage/text endpoint.
// Returns clean prose ready for rendering — no verse numbers, headings,
// footnotes, or passage-reference echoes. The verse range is already shown
// in the panel header, so inline numbers would be redundant noise.
//
// Same auth + caching shape as /api/verse-audio: ESV_API_KEY in the header,
// edge-cached for 7 days.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get("book");
  const ref = searchParams.get("ref");

  if (!book || !ref) {
    return Response.json({ error: "Missing book or ref" }, { status: 400 });
  }

  const apiKey = process.env.ESV_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API not configured" }, { status: 500 });
  }

  const apiBookName = API_BOOK_NAMES[book] || book;
  const passage = `${apiBookName} ${ref}`;

  const params = new URLSearchParams({
    q: passage,
    "include-passage-references": "false",
    "include-short-copyright": "false",
    "include-headings": "false",
    "include-footnotes": "false",
    "include-verse-numbers": "false",
    "include-first-verse-numbers": "false",
    "indent-paragraphs": "0",
    "indent-poetry-lines": "0",
  });
  const upstream = `https://api.esv.org/v3/passage/text/?${params.toString()}`;

  let res;
  try {
    res = await fetch(upstream, {
      headers: { Authorization: `Token ${apiKey}` },
      next: { revalidate: 604800 },
    });
  } catch {
    return Response.json({ error: "Request failed" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json({ error: "Verse not found" }, { status: res.status });
  }

  const data = await res.json();
  const passages = Array.isArray(data.passages) ? data.passages : [];
  const text = passages
    .map((p) => p.replace(/^\s+|\s+$/g, "").replace(/[ \t]+/g, " "))
    .filter(Boolean)
    .join("\n\n");

  if (!text) {
    return Response.json({ error: "Empty passage" }, { status: 404 });
  }

  return Response.json(
    { text, canonical: data.canonical || passage },
    {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    }
  );
}
