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
          Live on the iOS App Store, and on Android via Google Play closed
          testing. iOS is one tap. Android is two — both required, in order,
          because of Google&rsquo;s new-developer rules. The steps below walk
          you through it.
        </p>

        <h2 style={s.h2}>iOS — one tap</h2>
        <a href={APP_STORE_URL} style={s.btnPrimaryFull}>
          <span style={s.btnLabel}>Install on the App Store</span>
          <span style={s.btnSub}>iPhone or iPad</span>
        </a>

        <h2 style={s.h2}>Android — two taps, in order</h2>
        <p style={s.warn}>
          <strong>Both steps are required.</strong> Joining the group does{" "}
          <em>not</em> install the app — it only puts you on Google&rsquo;s
          tester allowlist. You then tap a separate Play Store link to install.
          If you stop after Step 1, the app will not appear on your phone.
        </p>

        <div style={s.stepCard}>
          <div style={s.stepHeader}>
            <span style={s.stepNum}>Step 1 of 2</span>
            <span style={s.stepTitle}>Join the testers group</span>
          </div>
          <p style={s.stepBody}>
            On your Android phone, tap the button below and sign in with the
            same Google account you use on the Play Store. Tap{" "}
            <em>Join group</em>. You won&rsquo;t get any emails — the group
            exists purely so Google knows you&rsquo;re allowed to install.
          </p>
          <a href={PLAY_GROUP_JOIN_URL} style={s.btnPrimary}>
            <span style={s.btnLabel}>Open the testers group →</span>
            <span style={s.btnSub}>Step 1 · won&rsquo;t install the app on its own</span>
          </a>
        </div>

        <div style={s.stepCard}>
          <div style={s.stepHeader}>
            <span style={s.stepNum}>Step 2 of 2</span>
            <span style={s.stepTitle}>Install from Play Store</span>
          </div>
          <p style={s.stepBody}>
            After Step 1, tap the button below on the <em>same</em> phone,
            signed in to the <em>same</em> Google account. Tap{" "}
            <em>Become a tester</em>, then tap{" "}
            <em>Download the app on Google Play</em> and install normally. From
            then on the app updates through the Play Store like any other app.
          </p>
          <a href={PLAY_OPT_IN_URL} style={s.btnPrimary}>
            <span style={s.btnLabel}>Open the Play Store install page →</span>
            <span style={s.btnSub}>Step 2 · this is what installs the app</span>
          </a>
        </div>

        <details style={s.details}>
          <summary style={s.summary}>Step 2 says I&rsquo;m not a tester</summary>
          <p style={s.stepBody}>
            Google&rsquo;s tester allowlist can take a minute or two to update
            after you join the group. Wait 60 seconds, then reopen the Step 2
            link. If it still says you&rsquo;re not a tester after a couple of
            minutes, email{" "}
            <a href="mailto:bibletour@askadam.cloud?subject=%5BBible%20Tour%5D%20Android%20tester%20access" style={s.link}>
              bibletour@askadam.cloud
            </a>{" "}
            with the Gmail address you used to join the group and I&rsquo;ll add
            you to the allowlist directly.
          </p>
        </details>

        <details style={s.details}>
          <summary style={s.summary}>Why two steps?</summary>
          <p style={s.stepBody}>
            Google requires new developer accounts to run a closed test for a
            while before the app can be published openly. Closed testing only
            lets allowlisted Google accounts install — and the group is how
            that allowlist is maintained. As soon as Google flips the app to
            production, the two-step disappears and Android will be one tap
            like iOS.
          </p>
        </details>

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
  btnPrimaryFull: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    background: C.yellow,
    color: C.tealDark,
    padding: "16px 18px",
    borderRadius: 10,
    textDecoration: "none",
    border: `1px solid ${C.yellow}`,
    marginTop: 8,
    marginBottom: 8,
  },
  warn: {
    color: C.offWhite,
    background: "rgba(255, 203, 33, 0.10)",
    border: `1px solid rgba(255, 203, 33, 0.45)`,
    padding: "14px 16px",
    borderRadius: 8,
    fontSize: 15,
    lineHeight: 1.55,
    marginBottom: 20,
  },
  stepCard: {
    background: C.teal,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
  },
  stepHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: 800,
    color: C.yellow,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: C.offWhite,
    marginTop: 4,
  },
  stepBody: {
    color: C.offWhite,
    fontSize: 15,
    lineHeight: 1.6,
    marginTop: 6,
    marginBottom: 14,
  },
  details: {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 14px",
    marginTop: 10,
    color: C.offWhite,
  },
  summary: {
    cursor: "pointer",
    fontWeight: 700,
    color: C.yellow,
    fontSize: 14,
    paddingTop: 2,
    paddingBottom: 2,
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
