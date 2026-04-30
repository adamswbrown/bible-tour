# LinkedIn post — mobile beta

Sized to fit LinkedIn's 3,000-character limit.

The `/beta` page handles both stores (TestFlight + Play opt-in via Google
Group), so this post links there once and lets people pick their platform.

---

Quick update on the side project I posted about a few months back: Tour of the Bible now has a native mobile app, in beta on iOS (TestFlight) and Android (Google Play closed testing).

→ Web: bible-tour.vercel.app
→ Beta (iOS + Android): bible-tour.vercel.app/beta

Same disclaimer as last time: this post is about the craft. The source material is Matt Whitman's "Lightning-Fast Field Guide to the Bible." Whether it resonates is your business — I'm sharing the build.


📱 What's in v1
A reading plan across all 66 books with curated verses for each. Verse text in NIV, NIrV, NIVUK, KJV, WEB, and ASV, plus ESV passages. Per-verse ESV audio with proper background playback (lock screen, AirPods, CarPlay). An "Originals" mode that lets you tap any Hebrew or Greek word in the KJV for its Strong's entry. Progress stays on-device. No accounts, no analytics SDKs, no ads.

🛠️ Stack
React Native via Expo SDK 55 and EAS Build, sharing the same Vercel API proxy as the web app so YouVersion and Crossway keys never leave the server.

📝 The honest part
Most of the last fortnight was form-filling, not coding. App Store privacy manifests, Play data-safety questionnaires, content rating, screenshots at exact pixel sizes — the platform paperwork dwarfed the actual code changes. Worth knowing if you've got a side project queued for the stores.

🙏 Credits
Reading plan: Matt Whitman / thetmbh.com/tourofthebible. NIV-family translations: YouVersion Developer Platform. ESV: Crossway API. Public-domain translations as listed. Strong's lexicon: Open Scriptures, CC BY-SA 3.0.

🧪 I need testers — Android especially
Google's new policy means a personal developer account needs 12 active testers on a closed track for 14 consecutive days before production unlocks. If you have an Android in a drawer and 5 minutes, the link is at the top.

🍎 iOS testers welcome too — TestFlight invite is on the same beta page.

🐛 Bug reports are gold, including "this verse looks wrong" and "your icon is ugly."

#SideProject #ReactNative #Expo #Vercel #IndieHacker
