#!/usr/bin/env python3
"""
Fetches Bible book intro summaries from Wikipedia for all 66 books.
Outputs: app/data/book-info.json
Content licensed CC BY-SA 4.0 — attribution required.
"""

import json
import re
import time
import urllib.request
import urllib.parse
from pathlib import Path

# (plan name, Wikipedia article title)
BOOKS = [
    ("Genesis", "Book of Genesis"),
    ("Exodus", "Book of Exodus"),
    ("Leviticus", "Book of Leviticus"),
    ("Numbers", "Book of Numbers"),
    ("Deuteronomy", "Book of Deuteronomy"),
    ("Joshua", "Book of Joshua"),
    ("Judges", "Book of Judges"),
    ("Ruth", "Book of Ruth"),
    ("I Samuel", "First Book of Samuel"),
    ("II Samuel", "Second Book of Samuel"),
    ("I Kings", "First Book of Kings"),
    ("II Kings", "Second Book of Kings"),
    ("I Chronicles", "First Book of Chronicles"),
    ("II Chronicles", "Second Book of Chronicles"),
    ("Ezra", "Book of Ezra"),
    ("Nehemiah", "Book of Nehemiah"),
    ("Esther", "Book of Esther"),
    ("Job", "Book of Job"),
    ("Psalms", "Psalms"),
    ("Proverbs", "Book of Proverbs"),
    ("Ecclesiastes", "Ecclesiastes"),
    ("Song of Songs", "Song of Songs"),
    ("Isaiah", "Book of Isaiah"),
    ("Jeremiah", "Book of Jeremiah"),
    ("Lamentations", "Book of Lamentations"),
    ("Ezekiel", "Book of Ezekiel"),
    ("Daniel", "Book of Daniel"),
    ("Hosea", "Book of Hosea"),
    ("Joel", "Book of Joel"),
    ("Amos", "Book of Amos"),
    ("Obadiah", "Book of Obadiah"),
    ("Jonah", "Book of Jonah"),
    ("Micah", "Book of Micah"),
    ("Nahum", "Book of Nahum"),
    ("Habakkuk", "Book of Habakkuk"),
    ("Zephaniah", "Book of Zephaniah"),
    ("Haggai", "Book of Haggai"),
    ("Zechariah", "Book of Zechariah"),
    ("Malachi", "Book of Malachi"),
    ("Matthew", "Gospel of Matthew"),
    ("Mark", "Gospel of Mark"),
    ("Luke", "Gospel of Luke"),
    ("John", "Gospel of John"),
    ("Acts", "Acts of the Apostles"),
    ("Romans", "Epistle to the Romans"),
    ("I Corinthians", "First Epistle to the Corinthians"),
    ("II Corinthians", "Second Epistle to the Corinthians"),
    ("Galatians", "Epistle to the Galatians"),
    ("Ephesians", "Epistle to the Ephesians"),
    ("Philippians", "Epistle to the Philippians"),
    ("Colossians", "Epistle to the Colossians"),
    ("I Thessalonians", "First Epistle to the Thessalonians"),
    ("II Thessalonians", "Second Epistle to the Thessalonians"),
    ("I Timothy", "First Epistle to Timothy"),
    ("II Timothy", "Second Epistle to Timothy"),
    ("Titus", "Epistle to Titus"),
    ("Philemon", "Epistle to Philemon"),
    ("Hebrews", "Epistle to the Hebrews"),
    ("James", "Epistle of James"),
    ("I Peter", "First Epistle of Peter"),
    ("II Peter", "Second Epistle of Peter"),
    ("I John", "First Epistle of John"),
    ("II John", "Second Epistle of John"),
    ("III John", "Third Epistle of John"),
    ("Jude", "Epistle of Jude"),
    ("Revelation", "Book of Revelation"),
]

def fetch_intro(title):
    params = urllib.parse.urlencode({
        "action": "query",
        "titles": title,
        "prop": "extracts",
        "exintro": True,
        "format": "json",
        "explaintext": True,
        "exsectionformat": "plain",
    })
    url = f"https://en.wikipedia.org/w/api.php?{params}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "bible-tour/1.0 (educational project; https://github.com)",
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    pages = data["query"]["pages"]
    page = next(iter(pages.values()))
    extract = page.get("extract", "")
    # Trim to first 3 paragraphs max
    paras = [p.strip() for p in extract.split("\n\n") if p.strip()]
    return "\n\n".join(paras[:3])

result = {}
errors = []

for plan_name, wiki_title in BOOKS:
    try:
        intro = fetch_intro(wiki_title)
        if intro:
            result[plan_name] = {"intro": intro}
            print(f"  ✓ {plan_name} ({len(intro)} chars)")
        else:
            print(f"  ✗ {plan_name}: empty extract")
            errors.append(plan_name)
    except Exception as e:
        print(f"  ✗ {plan_name}: {e}")
        errors.append(plan_name)
    time.sleep(0.3)

out_path = Path(__file__).parent.parent / "app" / "data" / "book-info.json"
with open(out_path, "w") as f:
    json.dump({
        "_attribution": "Intro text from Wikipedia (CC BY-SA 4.0). https://en.wikipedia.org",
        "books": result,
    }, f, indent=2)

print(f"\nDone. {len(result)}/66 books. Errors: {errors or 'none'}")
print(f"Written to {out_path}")
