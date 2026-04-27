export const metadata = {
  title: "Support | Tour of the Bible",
  description: "Help, FAQs, and contact for Tour of the Bible.",
};

const C = {
  teal: "#1B3A4B",
  tealDark: "#0F2530",
  yellow: "#FFCB21",
  offWhite: "#FFFEF5",
  textSecondary: "#8BAAB8",
  border: "#253D4E",
};

export default function Support() {
  return (
    <main style={s.page}>
      <article style={s.article}>
        <a href="/" style={s.backLink}>← Tour of the Bible</a>

        <h1 style={s.h1}>Support</h1>

        <p style={s.lede}>
          Need help? Email{" "}
          <a href="mailto:bibletour@askadam.cloud" style={s.link}>bibletour@askadam.cloud</a>
          {" "}— bug reports, feature requests, and general feedback all welcome. Replies
          are best-effort from one human (Adam) and usually arrive within a few days.
        </p>

        <h2 style={s.h2}>Frequently asked</h2>

        <h3 style={s.h3}>What translations does the app include?</h3>
        <p style={s.p}>
          The mobile app supports KJV, NIV, NIrV, NIVUK, ESV, NKJV, NLT, CSB, MSG, WEB,
          and ASV. KJV / WEB / ASV / ESV / NIV / NIrV / NIVUK render passage text
          inline. The other translations (NKJV, NLT, CSB, MSG) open the passage in
          YouVersion when tapped, because their licences don&rsquo;t allow inline
          rendering in third-party apps.
        </p>

        <h3 style={s.h3}>Why doesn&rsquo;t the audio play?</h3>
        <p style={s.p}>
          Audio is only available for the ESV, via the Crossway audio service. Make
          sure your device is online — audio is streamed, not stored on-device. If the
          play button shows a spinner forever, it&rsquo;s usually a transient network
          issue; closing and reopening the verse modal forces a fresh request.
        </p>

        <h3 style={s.h3}>What is &ldquo;Originals&rdquo;?</h3>
        <p style={s.p}>
          Originals shows the KJV verse with each Hebrew or Greek word highlighted in
          yellow. Tap any highlighted word to see its Strong&rsquo;s lexicon entry —
          part of speech, gloss, full Hebrew or Greek definition, and a link to Blue
          Letter Bible for deeper study. The lexicon data is from{" "}
          <a href="https://github.com/openscriptures/strongs" style={s.link}>
            Open Scriptures
          </a>{" "}
          and is licensed under CC BY-SA 3.0.
        </p>

        <h3 style={s.h3}>Where is my reading progress stored?</h3>
        <p style={s.p}>
          On your own device. Mobile uses iOS&rsquo;s local app storage; the web uses
          browser localStorage. Progress is never sent to a server, which means it
          doesn&rsquo;t sync between devices automatically — that&rsquo;s an intentional
          tradeoff for keeping the app account-less. You can reset progress from the
          Settings tab in the mobile app.
        </p>

        <h3 style={s.h3}>Will the app sync between my iPhone and iPad?</h3>
        <p style={s.p}>
          Not yet. iCloud sync that uses your existing Apple ID (no account required
          on our side) is on the roadmap.
        </p>

        <h3 style={s.h3}>Can I get the daily reminder at a different time?</h3>
        <p style={s.p}>
          Currently the reminder is fixed at 9 am. If you&rsquo;d like a configurable
          time, drop us an email — we&rsquo;ll know there&rsquo;s demand.
        </p>

        <h3 style={s.h3}>Is this app affiliated with The Ten Minute Bible Hour?</h3>
        <p style={s.p}>
          No. Tour of the Bible is an independent companion to Matt Whitman&rsquo;s
          book <em>The Lightning-Fast Field Guide to the Bible</em>. It is not
          affiliated with or endorsed by The Ten Minute Bible Hour, the YouTube
          channel, or any other Whitman-related project.
        </p>

        <h3 style={s.h3}>How is data handled?</h3>
        <p style={s.p}>
          See the <a href="/privacy" style={s.link}>privacy policy</a>. Short version:
          no accounts, no tracking, no third-party analytics in the mobile app, your
          reading progress stays on your device.
        </p>

        <h2 style={s.h2}>Reporting a bug</h2>
        <p style={s.p}>
          The most useful bug reports include:
        </p>
        <ul style={s.ul}>
          <li>What you tapped or did</li>
          <li>What you expected to happen</li>
          <li>What actually happened</li>
          <li>Your device (e.g. iPhone 15 Pro) and iOS version</li>
          <li>Whether the issue is reproducible or one-off</li>
        </ul>
        <p style={s.p}>
          Email{" "}
          <a href="mailto:bibletour@askadam.cloud?subject=%5BBible%20Tour%5D%20Bug%20report" style={s.link}>
            bibletour@askadam.cloud
          </a>{" "}— or use the &ldquo;Send feedback&rdquo; button in the mobile app&rsquo;s
          Settings, which pre-fills the subject and your platform info.
        </p>

        <p style={s.disclaimer}>
          Tour of the Bible is not affiliated with or endorsed by The Ten Minute Bible Hour.
        </p>
      </article>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: C.tealDark,
    color: C.offWhite,
    fontFamily: '-apple-system, BlinkMacSystemFont, "DM Sans", system-ui, sans-serif',
    padding: "32px 16px 64px",
  },
  article: {
    maxWidth: 720,
    margin: "0 auto",
    fontSize: 16,
    lineHeight: 1.7,
  },
  backLink: {
    color: C.yellow,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  h1: {
    color: C.yellow,
    fontSize: 32,
    fontWeight: 800,
    marginTop: 24,
    marginBottom: 24,
  },
  lede: {
    fontSize: 17,
    color: C.offWhite,
    background: C.teal,
    padding: 16,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
  },
  h2: {
    color: C.yellow,
    fontSize: 18,
    fontWeight: 700,
    marginTop: 40,
    marginBottom: 12,
  },
  h3: {
    color: C.offWhite,
    fontSize: 15,
    fontWeight: 700,
    marginTop: 24,
    marginBottom: 4,
  },
  p: { color: C.offWhite },
  ul: { color: C.offWhite, paddingLeft: 22 },
  link: { color: C.yellow, textDecoration: "underline" },
  disclaimer: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 48,
    paddingTop: 24,
    borderTop: `1px solid ${C.border}`,
  },
};
