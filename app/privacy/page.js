export const metadata = {
  title: "Privacy Policy | Tour of the Bible",
  description: "How Tour of the Bible handles data. Short version: nothing personal is collected.",
};

const C = {
  teal: "#1B3A4B",
  tealDark: "#0F2530",
  yellow: "#FFCB21",
  offWhite: "#FFFEF5",
  textSecondary: "#8BAAB8",
  border: "#253D4E",
};

const LAST_UPDATED = "27 April 2026";

export default function Privacy() {
  return (
    <main style={s.page}>
      <article style={s.article}>
        <a href="/" style={s.backLink}>← Tour of the Bible</a>

        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.lastUpdated}>Last updated: {LAST_UPDATED}</p>

        <p style={s.lede}>
          Short version: Tour of the Bible doesn&rsquo;t require an account, doesn&rsquo;t track
          you across other apps or websites, and doesn&rsquo;t share data with advertisers.
          Your reading progress is stored on your own device. Nothing personal is collected.
        </p>

        <h2 style={s.h2}>What we don&rsquo;t do</h2>
        <ul style={s.ul}>
          <li>No user accounts. No sign-up, no login.</li>
          <li>No advertising. No advertising identifiers (IDFA / GAID) read or written.</li>
          <li>No third-party analytics SDKs in the mobile app.</li>
          <li>No App Tracking Transparency prompt because we don&rsquo;t track you across apps.</li>
          <li>No social-network integrations.</li>
          <li>Your reading progress is never sent to a server.</li>
        </ul>

        <h2 style={s.h2}>Data stored on your device</h2>
        <p style={s.p}>
          The app stores three things in local storage on your device, and nowhere else:
        </p>
        <ul style={s.ul}>
          <li><strong>Reading progress</strong>: which of the 66 books you&rsquo;ve marked as read.</li>
          <li><strong>Default translation</strong>: the abbreviation (e.g. &ldquo;KJV&rdquo;) you&rsquo;ve picked as your starting translation.</li>
          <li><strong>Daily reminder preference</strong>: whether you&rsquo;ve enabled the optional 9 am notification.</li>
        </ul>
        <p style={s.p}>
          This data lives in browser <code>localStorage</code> on the web and in
          <code> AsyncStorage</code> in the mobile app. It never leaves your device.
          You can delete it any time by clearing the browser&rsquo;s site data, or by
          using <strong>Settings → Reset progress</strong> in the mobile app.
        </p>

        <h2 style={s.h2}>What our backend processes</h2>
        <p style={s.p}>
          When you tap a verse reference, the app fetches the passage text or audio from
          one of the following sources via a small Vercel-hosted proxy. The proxy exists
          so that third-party API keys stay on the server rather than in the app itself.
        </p>
        <ul style={s.ul}>
          <li>
            <strong>YouVersion Developer API</strong> — for NIV, NIrV, NIVUK, and BSB passages.
            We request the verse you&rsquo;ve tapped and pass the text back to your device.
            See YouVersion&rsquo;s <a href="https://platform.youversion.com/terms" style={s.link}>terms</a>.
          </li>
          <li>
            <strong>Crossway ESV API</strong> — for ESV passage text and per-verse audio.
            See Crossway&rsquo;s <a href="https://api.esv.org/docs/" style={s.link}>API conditions</a>.
          </li>
          <li>
            <strong>bible-api.com</strong> — for public-domain translations (KJV, WEB, ASV).
          </li>
        </ul>
        <p style={s.p}>
          When the proxy receives a request from your device, Vercel&rsquo;s infrastructure
          logs the request URL, your IP address, the user agent, and the response status
          code. This is standard server log data, used for debugging and abuse prevention.
          We do not associate these logs with any personal identifier (we don&rsquo;t have
          one — there are no accounts). Vercel retains short-term logs per its
          {" "}<a href="https://vercel.com/legal/privacy-policy" style={s.link}>privacy policy</a>.
        </p>
        <p style={s.p}>
          The third-party APIs above receive the verse reference and the bible ID. They
          do not receive your IP address, because the request is proxied through our
          server. They also receive standard request metadata (timestamp, user agent of
          our proxy).
        </p>

        <h2 style={s.h2}>Web analytics</h2>
        <p style={s.p}>
          The web version of Tour of the Bible (this site) uses Vercel Web Analytics for
          aggregated, cookie-free usage statistics. Vercel collects: page URL, referrer,
          city-level geolocation derived from IP, device type, OS, and browser version.
          A daily-rotated hash identifies sessions; no persistent identifier is created
          and the hash is discarded after 24 hours. See{" "}
          <a href="https://vercel.com/docs/analytics/privacy-policy" style={s.link}>
            Vercel&rsquo;s analytics privacy notice
          </a>{" "}for details.
        </p>
        <p style={s.p}>
          The <strong>mobile app does not include analytics</strong>. The privacy
          nutrition label in the App Store reflects this.
        </p>

        <h2 style={s.h2}>Notifications (mobile only)</h2>
        <p style={s.p}>
          If you enable the daily reminder in mobile Settings, the app schedules a
          local notification to fire at 9 am each day. There is no push notification
          server, no remote token registration, and no remote service that knows you
          have notifications enabled. You can disable the reminder at any time, or
          revoke notification permission entirely in iOS Settings.
        </p>

        <h2 style={s.h2}>Children&rsquo;s privacy</h2>
        <p style={s.p}>
          Tour of the Bible does not knowingly collect any data from children. Because
          we don&rsquo;t collect data at all, this is essentially the default. The app
          is rated 12+ in the App Store because some Old Testament passages contain
          content that may not be appropriate for younger children, but the app itself
          is suitable for any age that can read.
        </p>

        <h2 style={s.h2}>Your rights</h2>
        <p style={s.p}>
          Because we don&rsquo;t collect personal data, there is nothing to delete,
          export, or correct on our end. Your reading progress and preferences are
          fully under your control on your own device.
        </p>
        <p style={s.p}>
          For questions about this policy, email{" "}
          <a href="mailto:bibletour@askadam.cloud" style={s.link}>bibletour@askadam.cloud</a>.
        </p>

        <h2 style={s.h2}>Changes to this policy</h2>
        <p style={s.p}>
          If we change anything substantive, the &ldquo;Last updated&rdquo; date at the
          top of this page changes too. Material changes that introduce data collection
          (which we don&rsquo;t plan) would be announced in the app and on this page.
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
    marginBottom: 8,
  },
  lastUpdated: {
    color: C.textSecondary,
    fontSize: 13,
    marginTop: 0,
    marginBottom: 32,
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
    marginTop: 36,
    marginBottom: 8,
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
