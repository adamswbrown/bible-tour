export const metadata = {
  title: "Beta testers wanted | Tour of the Bible",
  description: "Help test the Tour of the Bible mobile app on iOS or Android before the public release.",
};

const C = {
  teal: "#1B3A4B",
  tealDark: "#0F2530",
  yellow: "#FFCB21",
  offWhite: "#FFFEF5",
  textSecondary: "#8BAAB8",
  border: "#253D4E",
};

// Public App Store listing — released, no TestFlight gating needed.
const APP_STORE_URL = "https://apps.apple.com/app/tour-of-the-bible/id6764106620";
// Google Group for the Android closed-test tester list. Anyone can join.
const PLAY_GROUP_JOIN_URL = "https://groups.google.com/g/bible-tour-android-testers";
// Play Store opt-in (works after the user has joined the Google Group above).
const PLAY_OPT_IN_URL = "https://play.google.com/apps/testing/cloud.askadam.bibletour";

export default function Beta() {
  return (
    <main style={s.page}>
      <article style={s.article}>
        <a href="/" style={s.backLink}>← Tour of the Bible</a>

        <h1 style={s.h1}>Want to help test the app?</h1>

        <p style={s.lede}>
          The Tour of the Bible mobile app is live on the iOS App Store and
          available on Android via Google Play closed testing. Pick your
          platform below — the iOS path is one tap, the Android path is a
          quick two-step until Google unlocks the public store later this
          month.
        </p>

        <p style={s.p}>
          If you give it a try, I&rsquo;d love your feedback — anything from
          &ldquo;this verse looks wrong&rdquo; to &ldquo;the icon is ugly&rdquo;.
        </p>

        <div style={s.buttonRow}>
          <a href={APP_STORE_URL} style={s.btnPrimary}>
            <span style={s.btnLabel}>iOS on the App Store</span>
            <span style={s.btnSub}>iPhone or iPad</span>
          </a>
          <a href={PLAY_GROUP_JOIN_URL} style={s.btnPrimary}>
            <span style={s.btnLabel}>Android via Play Store</span>
            <span style={s.btnSub}>Two-step — join group, then install</span>
          </a>
        </div>

        <h2 style={s.h2}>What happens when I tap the link?</h2>

        <h3 style={s.h3}>iOS (App Store)</h3>
        <p style={s.p}>
          Tap the iOS button above on your iPhone or iPad — it opens the App
          Store listing for Tour of the Bible. Tap <em>Get</em> and the app
          installs like any other. No TestFlight, no invite codes, no account
          required.
        </p>

        <h3 style={s.h3}>Android (Play Store)</h3>
        <p style={s.p}>
          Google&rsquo;s policy for new developer accounts means I can&rsquo;t
          offer a single magic link until production unlocks (in about two
          weeks). Until then it&rsquo;s a two-step:
        </p>
        <ol style={s.ul}>
          <li>
            Tap the Android button above. It opens a public Google Group called{" "}
            <em>bible-tour-android-testers</em>. Tap <em>Join group</em> with
            whatever Gmail you use on your phone.
          </li>
          <li>
            Once you&rsquo;re in the group, open{" "}
            <a href={PLAY_OPT_IN_URL} style={s.link}>this Play Store link</a> on
            your phone, tap <em>Become a tester</em>, then tap{" "}
            <em>Download the app on Google Play</em> and install as normal.
          </li>
        </ol>
        <p style={s.p}>
          From then on the app updates automatically through the Play Store like
          any other app. You won&rsquo;t get any emails from the group — it
          exists purely so Google&rsquo;s testing pipeline knows you&rsquo;re
          allowed in.
        </p>

        <h2 style={s.h2}>What am I actually testing?</h2>
        <p style={s.p}>
          Just use the app. Read a few verses. Try the audio. Tap a Hebrew or Greek
          word in Originals mode. Tick a book off. Then tell me anything that
          looked wrong, felt clunky, or surprised you. Specifically helpful:
        </p>
        <ul style={s.ul}>
          <li>Verses that render incorrectly (wrong text, missing punctuation, weird formatting)</li>
          <li>Audio that won&rsquo;t play, cuts out, or plays through the wrong speaker</li>
          <li>Anything that crashes the app — even once</li>
          <li>Anything that looks ugly or confusing</li>
          <li>Anything you&rsquo;d expect to be there that isn&rsquo;t</li>
        </ul>

        <h2 style={s.h2}>How to send feedback</h2>
        <p style={s.p}>
          Easiest path: open the app&rsquo;s Settings tab and tap{" "}
          <em>Send feedback</em>. That opens an email with your platform info
          pre-filled, so I know which device the report is from. Or email{" "}
          <a href="mailto:bibletour@askadam.cloud?subject=%5BBible%20Tour%5D%20Beta%20feedback" style={s.link}>
            bibletour@askadam.cloud
          </a>{" "}directly with whatever&rsquo;s on your mind.
        </p>

        <h2 style={s.h2}>What you&rsquo;re signing up for</h2>
        <ul style={s.ul}>
          <li>A free, no-account, no-ads, no-tracking Bible reading app on your phone</li>
          <li>Auto-updates through TestFlight or Play Store as I push fixes</li>
          <li>Zero spam — the only emails you&rsquo;ll get from me are if you reply to one</li>
          <li>The right to leave whenever you want (uninstall, or tap <em>Stop testing</em> in TestFlight / Play)</li>
        </ul>

        <h2 style={s.h2}>What this app actually is</h2>
        <p style={s.p}>
          A companion to Matt Whitman&rsquo;s <em>Lightning-Fast Field Guide to
          the Bible</em>: a guided tour through every book of the Bible in about
          90 minutes of reading, with curated verses for each book, ten
          translations, per-verse ESV audio, and a tappable Hebrew/Greek lexicon
          for word-level study. Reading progress stays on your device. There is
          no account and no tracking.
        </p>
        <p style={s.p}>
          More detail on the <a href="/" style={s.link}>home page</a> and the{" "}
          <a href="/support" style={s.link}>support page</a>. Privacy details on
          the <a href="/privacy" style={s.link}>privacy policy</a>.
        </p>

        <p style={s.disclaimer}>
          Tour of the Bible is not affiliated with or endorsed by The Ten Minute
          Bible Hour. Thanks for helping out — Adam.
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
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  btnPrimary: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    background: C.yellow,
    color: C.tealDark,
    padding: "16px 18px",
    borderRadius: 10,
    textDecoration: "none",
    border: `1px solid ${C.yellow}`,
    transition: "transform 0.1s ease",
  },
  btnDisabled: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    background: "transparent",
    color: C.textSecondary,
    padding: "16px 18px",
    borderRadius: 10,
    border: `1px dashed ${C.border}`,
    cursor: "not-allowed",
  },
  btnLabel: {
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1.2,
  },
  btnSub: {
    fontWeight: 500,
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
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
