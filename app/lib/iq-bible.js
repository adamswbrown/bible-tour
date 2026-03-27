import "server-only";

import { cache } from "react";
import { normalizeBookInfo } from "./book-data";

const HOST = process.env.IQ_BIBLE_HOST || "iq-bible.p.rapidapi.com";
const API_KEY = process.env.IQ_BIBLE_API_KEY;
const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

function normalizeCount(data, field) {
  if (data == null) return null;

  if (typeof data === "number") return data;

  if (typeof data === "string") {
    const parsed = Number(data);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(data)) {
    return normalizeCount(data[0], field);
  }

  const parsed = Number(data[field]);
  return Number.isFinite(parsed) ? parsed : null;
}

const fetchIqBibleJson = cache(async (endpoint, params = {}) => {
  if (!API_KEY) return null;

  const url = new URL(`https://${HOST}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        "x-rapidapi-host": HOST,
        "x-rapidapi-key": API_KEY,
      },
      next: { revalidate: WEEK_IN_SECONDS },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
});

export const getIqBookInfo = cache(async (bookId) => {
  const data = await fetchIqBibleJson("GetBookInfo", {
    bookId,
    language: "english",
  });

  return normalizeBookInfo(data);
});

export const getIqVerseCount = cache(async (bookId, chapterId, versionId = "kjv") => {
  const data = await fetchIqBibleJson("GetVerseCount", {
    bookId,
    chapterId,
    versionId,
  });

  return normalizeCount(data, "verseCount");
});
