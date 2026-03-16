export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bibleId = searchParams.get("bible_id");
  const usfm = searchParams.get("usfm");

  if (!bibleId || !usfm) {
    return Response.json({ error: "Missing bible_id or usfm" }, { status: 400 });
  }

  const apiKey = process.env.YOUVERSION_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.youversion.com/v1/bibles/${bibleId}/passages/${encodeURIComponent(usfm)}?format=text`,
      {
        headers: { "X-YVP-App-Key": apiKey },
        next: { revalidate: 604800 }, // Next.js Data Cache: 7 days
      }
    );

    if (!res.ok) {
      return Response.json({ error: "Verse not found" }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data, {
      headers: {
        // Vercel edge CDN caches 7 days, browsers cache 1 day
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}
