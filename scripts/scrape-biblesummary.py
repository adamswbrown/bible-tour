#!/usr/bin/env python3
"""
Scrapes biblesummary.info for all 66 canonical books.
Outputs: app/data/chapter-summaries.json
Attribution: Content from biblesummary.info by Chris Juby (CC BY-NC 3.0)
"""

import json
import re
import time
import urllib.request
from pathlib import Path

BOOKS = [
    # Old Testament
    ("Genesis", "genesis"),
    ("Exodus", "exodus"),
    ("Leviticus", "leviticus"),
    ("Numbers", "numbers"),
    ("Deuteronomy", "deuteronomy"),
    ("Joshua", "joshua"),
    ("Judges", "judges"),
    ("Ruth", "ruth"),
    ("I Samuel", "1-samuel"),
    ("II Samuel", "2-samuel"),
    ("I Kings", "1-kings"),
    ("II Kings", "2-kings"),
    ("I Chronicles", "1-chronicles"),
    ("II Chronicles", "2-chronicles"),
    ("Ezra", "ezra"),
    ("Nehemiah", "nehemiah"),
    ("Esther", "esther"),
    ("Job", "job"),
    ("Psalms", "psalms"),
    ("Proverbs", "proverbs"),
    ("Ecclesiastes", "ecclesiastes"),
    ("Song of Songs", "song-of-songs"),
    ("Isaiah", "isaiah"),
    ("Jeremiah", "jeremiah"),
    ("Lamentations", "lamentations"),
    ("Ezekiel", "ezekiel"),
    ("Daniel", "daniel"),
    ("Hosea", "hosea"),
    ("Joel", "joel"),
    ("Amos", "amos"),
    ("Obadiah", "obadiah"),
    ("Jonah", "jonah"),
    ("Micah", "micah"),
    ("Nahum", "nahum"),
    ("Habakkuk", "habakkuk"),
    ("Zephaniah", "zephaniah"),
    ("Haggai", "haggai"),
    ("Zechariah", "zechariah"),
    ("Malachi", "malachi"),
    # New Testament
    ("Matthew", "matthew"),
    ("Mark", "mark"),
    ("Luke", "luke"),
    ("John", "john"),
    ("Acts", "acts"),
    ("Romans", "romans"),
    ("I Corinthians", "1-corinthians"),
    ("II Corinthians", "2-corinthians"),
    ("Galatians", "galatians"),
    ("Ephesians", "ephesians"),
    ("Philippians", "philippians"),
    ("Colossians", "colossians"),
    ("I Thessalonians", "1-thessalonians"),
    ("II Thessalonians", "2-thessalonians"),
    ("I Timothy", "1-timothy"),
    ("II Timothy", "2-timothy"),
    ("Titus", "titus"),
    ("Philemon", "philemon"),
    ("Hebrews", "hebrews"),
    ("James", "james"),
    ("I Peter", "1-peter"),
    ("II Peter", "2-peter"),
    ("I John", "1-john"),
    ("II John", "2-john"),
    ("III John", "3-john"),
    ("Jude", "jude"),
    ("Revelation", "revelation"),
]

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "bible-tour/1.0 (educational project)"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8")

def parse_chapters(html):
    """Extract chapter summaries from a book page."""
    chapters = {}
    # Each chapter is in <p class="summary_content ...">
    # <span class="chapter_number">N</span> summary text
    pattern = re.compile(
        r'<p class="summary_content[^"]*">'
        r'<span class="chapter_number">(\d+)</span>\s*(.*?)</p>',
        re.DOTALL
    )
    for match in pattern.finditer(html):
        chapter_num = int(match.group(1))
        summary = match.group(2).strip()
        # Strip any remaining HTML tags
        summary = re.sub(r'<[^>]+>', '', summary).strip()
        chapters[chapter_num] = summary
    return chapters

result = {}
errors = []

for book_name, slug in BOOKS:
    url = f"https://biblesummary.info/{slug}"
    try:
        html = fetch(url)
        chapters = parse_chapters(html)
        if chapters:
            result[book_name] = chapters
            print(f"  ✓ {book_name}: {len(chapters)} chapters")
        else:
            print(f"  ✗ {book_name}: no chapters found")
            errors.append(book_name)
    except Exception as e:
        print(f"  ✗ {book_name}: {e}")
        errors.append(book_name)
    time.sleep(0.4)  # polite rate limiting

# Write output
out_path = Path(__file__).parent.parent / "app" / "data" / "chapter-summaries.json"
out_path.parent.mkdir(exist_ok=True)

with open(out_path, "w") as f:
    json.dump({
        "_attribution": "Chapter summaries from biblesummary.info by Chris Juby. Used with attribution for non-commercial educational use.",
        "_source": "https://biblesummary.info",
        "books": result
    }, f, indent=2)

total_chapters = sum(len(v) for v in result.values())
print(f"\nDone. {len(result)}/66 books, {total_chapters} chapters total.")
if errors:
    print(f"Errors: {errors}")
print(f"Written to: {out_path}")
