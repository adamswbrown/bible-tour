# From Bible Tour to Eagle Method

I didn’t set out to build a Bible app.

I just wanted a better way to use [Matt Whitman’s *Lightning-Fast Field Guide to the Bible*](https://www.thetmbh.com/tourofthebible) in real life.

What I loved about the idea behind the tour was how refreshingly doable it felt. Instead of treating the Bible like something you had to conquer with a giant reading plan, it gave you a way to move across all 66 books in one sitting by reading a small set of carefully chosen passages. It made the whole thing feel approachable.

But as soon as I tried imagining myself actually using it, I kept running into the same thought: this would be much easier with a really simple companion app.

Not a platform. Not a church product. Not an “engagement” machine with accounts, streaks, notifications, and all the usual baggage. Just something clean that would let you open the verses quickly, keep your place, and make the whole experience feel less awkward.

That was the beginning of **Bible Tour**.

## The first version was intentionally small

The main app is basically built around one promise: make it easy to move through the tour without friction.

So I kept it simple on purpose.

It runs on **Next.js 16** and **Vercel**. It stores progress in `localStorage`. There’s no database. No user table. No real backend apart from a small verse proxy where it actually matters. You open the app and start reading.

That local-first decision ended up shaping almost everything else.

I didn’t want somebody to feel like they had to “join” something before they could read Genesis 12 or Romans 1. I wanted the app to feel ready the second it loaded.

So the first version focused on a few practical things:

- a checklist covering all 66 books
- inline verse reading
- translation options
- progress that stays on the device

That sounds modest, but I still think modest is underrated in software. A lot of products are bloated because they’re trying to prove how much they can do. This one got better every time I cut it back to what actually helped.

## Translation support turned out to be a very real design problem

One thing I didn’t want to fake was Bible translation support.

People actually care which version they’re reading, and for good reason. But the moment you support multiple translations, you run into the practical reality that not every version can be handled the same way.

So the app ended up with a split setup:

- **YouVersion Developer API** for licensed translations like NIV
- **bible-api.com** for public-domain translations like KJV, WEB, and ASV

That meant I could offer real options without pretending the licensing landscape didn’t exist. If the text can be shown inline, great. If it can’t, the app hands off cleanly instead of doing something weird.

In hindsight, that was one of the more important product decisions in the whole build. It kept the experience honest.

## Then I ran into the next obvious question

Once the main app existed, I started feeling the limitation of it pretty quickly.

Bible Tour is great for breadth. It helps you move. It helps you get a feel for the shape of Scripture. But after you’ve worked through a few books, another question starts to show up:

What do you do when one of those verses actually sticks with you?

What if you don’t just want to check off Ephesians or Isaiah or John? What if you want to remember something from it properly?

That’s where the **Eagle Method** came in.

I’d been watching [a video from Bible Animations](https://www.youtube.com/watch?v=V6cLQVFQN7o) that described Scripture memory in a way I found really compelling. The framing was simple:

1. Survey the river.
2. Map the river.
3. Follow the current.

What I liked about it was that it didn’t treat memorisation like brute-force repetition. It treated it more like orientation. Before trying to hold onto a verse, you first understand the book, then find the verse inside it, then follow the surrounding flow of thought so the verse isn’t floating around by itself.

That immediately felt like the natural “part two” of Bible Tour.

The first app helps you travel across the Bible.
The Eagle layer helps you stay with something once you’ve found it.

## I didn’t want a separate product

This part mattered to me.

I could have taken the Eagle idea and spun it into a separate app, but that would have been the wrong move. It would have fractured the experience and duplicated a bunch of logic the project already had.

The original app already knew:

- the books
- the reading plan
- the verse references
- the translation setup

So instead of building something parallel, I added a second route structure:

- `/eagle`
- `/eagle/[book]`

That let the study flow grow out of the tour instead of sitting awkwardly beside it.

## The Eagle app became a different kind of reading experience

The Eagle index is pretty lightweight. It lets you browse all the books, filter by testament, and mark books as studied. It’s meant to feel like a doorway, not a destination.

The real work happens on the book pages.

Each one walks through the three stages.

### Stage 1: Survey the river

This is the part where you ask the basic questions you should probably ask before trying to “memorise” anything:

- Who wrote this?
- When?
- For whom?
- Why?

I didn’t want this stage to turn into a giant commentary layer. The goal wasn’t to build a theology engine. The goal was just to give each book a lens.

So the app uses local intro data in `app/data/book-info.json`, with optional IQ Bible enrichment where it helps. That keeps the feature useful without making it brittle.

### Stage 2: Map the river

This is the part I found unexpectedly satisfying to build.

A reference like `Ephesians 2:8-10` is not just a citation. It has shape. It lives somewhere in the book. It has a physical sense to it once you stop treating it like a disconnected label.

So I built parsing around the actual kinds of references in the reading plan:

- single verses
- verse ranges
- cross-chapter spans
- chapter spans
- oddball qualitative references that don’t fit neatly into verse math

That let the app do more than say, “Here is your target verse.” It could say, “This lands in chapter 2,” or, where verse counts are available, “This sits roughly here inside the chapter.”

That may sound like a small thing, but I don’t think it is. Location helps memory. Context helps memory. Shape helps memory.

And once I brought the translation system from the main app into Eagle as well, the study flow started feeling much more complete. Now you can read those target verses in the same family of versions the main app supports, with the Eagle side defaulting to **NIV**.

### Stage 3: Follow the current

This was the turning point.

I knew I didn’t want every Eagle page to depend on live third-party requests for context. That would make the experience slower, more fragile, and harder to reason about. So instead, I decided to pre-bake the chapter-level summary layer into the project.

I scraped and normalized chapter summaries for all 66 books.

That gave me:

- **1,189 chapter summaries**
- stored locally in `app/data/chapter-summaries.json`
- no runtime dependency for the core context layer

That one decision changed the feel of the feature more than anything else.

Once those summaries were in place, the book pages could build context windows around the target passages instantly. If a reading-plan verse lands in chapter 6, the page can show the nearby chapters, highlight the target zone, and help the reader follow the current of the argument or story.

That made the feature feel less like a UI experiment and more like an actual study tool.

## Underneath it all, the code got cleaner

One thing I’m happy about is that the Eagle work didn’t just add features. It forced the project into a better shape.

The reading plan now lives in a shared module instead of being scattered around route files. Book names, slugs, ids, and reference parsing all come from the same place. The translation definitions are shared too. That means the main app and the Eagle app are not quietly drifting apart every time I touch one of them.

There’s still cleanup I’d do if I kept pushing on it. Some of the UI is still inline in route files, and the Eagle side definitely has room to be componentised further. But the structure is better now than it was when this started, and that matters.

## What I like about the two apps together

The main app and the Eagle app are solving different problems, but they belong in the same product.

The main app is for movement.
The Eagle app is for staying.

The main app says: here’s how to get your bearings across the whole Bible.

The Eagle app says: now that something caught your attention, here’s how to sit with it properly.

That pairing feels honest to me. It also feels more useful than trying to pretend one interface should do everything.

## What the build reminded me of

This project reinforced something I keep relearning: the best feature ideas usually show up as the next natural question inside something that already works.

Bible Tour worked because it removed friction.

Then the next question was not, “How do I make this bigger?”

It was, “What does a person need after this?”

The answer wasn’t more dashboard. It wasn’t community. It wasn’t AI everywhere. It was context.

That’s what the Eagle app added.

And I think that’s why it feels like it belongs.

## The short version

I built **Bible Tour** as a simple, local-first companion to [Matt Whitman’s *Lightning-Fast Field Guide to the Bible*](https://www.thetmbh.com/tourofthebible) so people could actually move through the 66-book tour without friction.

Then I built **Eagle Method** into the same app as the natural next step: a book-by-book study flow, inspired by [Bible Animations](https://www.youtube.com/@bible.animations), that helps you understand a verse by understanding the book, the location, and the surrounding current of thought.

It’s still a small project.

That’s part of why I like it.

It does two related things, and it does them with a pretty clear point of view.

---

## Publishing notes

- Keep the non-affiliation line for [Matt Whitman / The Ten Minute Bible Hour](https://www.thetmbh.com/tourofthebible).
- Credit [Bible Animations](https://www.youtube.com/@bible.animations) for the Eagle Method inspiration.
- Credit biblesummary.info / Chris Juby if you mention the chapter-summary data directly.
- Credit Wikipedia if you talk about the local intro-summary pipeline.
