import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const s = {
  page: { background: "#000", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" } as const,
  wrap: { maxWidth: 640, margin: "0 auto", padding: "48px 24px" } as const,
  brand: { color: "#e8430a", fontSize: 20, fontWeight: 700, textDecoration: "none" } as const,
  title: { color: "rgba(255,255,255,0.87)", fontSize: 32, fontWeight: 700, margin: "32px 0 8px" } as const,
  sub: { color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 48px" } as const,
  h: { color: "rgba(255,255,255,0.87)", fontSize: 18, fontWeight: 600, margin: "40px 0 12px" } as const,
  p: { color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.7, margin: "0 0 16px" } as const,
  ul: { color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 24 } as const,
  footer: { color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center" as const, marginTop: 48, paddingBottom: 32 },
};

const PrivacyPolicy = () => (
  <div style={s.page}>
    <SEOHead
      title="Privacy Policy — Wavebound"
      description="Wavebound privacy policy. How we collect, store, and protect your data."
      canonical="/privacy"
    />
    <div style={s.wrap}>
      <Link to="/" style={s.brand}>Wavebound</Link>
      <h1 style={s.title}>Privacy Policy</h1>
      <p style={s.sub}>Effective March 2026</p>

      <h2 style={s.h}>What we collect</h2>
      <p style={s.p}>Wavebound collects the following data when you use the app:</p>
      <ul style={s.ul}>
        <li>Email address (for authentication)</li>
        <li>TikTok handle (to generate your content plan)</li>
        <li>Content plan interactions (swipe decisions on ideas)</li>
        <li>Chat messages (to provide AI-powered advice)</li>
        <li>Push notification tokens (to send you updates)</li>
      </ul>

      <h2 style={s.h}>How we store it</h2>
      <p style={s.p}>Your data is stored in Supabase, hosted on AWS infrastructure. All data is encrypted at rest and in transit via TLS. We do not sell or share your personal data with advertisers.</p>

      <h2 style={s.h}>Third-party services</h2>
      <p style={s.p}>We use the following services to operate the app:</p>
      <ul style={s.ul}>
        <li>Supabase — authentication and database</li>
        <li>Expo Push Notifications — delivering push notifications to your device</li>
        <li>Anthropic API — chat messages are sent to Anthropic's Claude for AI processing. Messages are not used to train AI models.</li>
        <li>Sentry — anonymous crash reporting to help us fix bugs. No personally identifiable information is collected.</li>
      </ul>

      <h2 style={s.h}>Data retention</h2>
      <p style={s.p}>Your account data is retained for as long as your account exists. Chat messages and content plan interactions are stored indefinitely until you delete your account.</p>

      <h2 style={s.h}>Your rights</h2>
      <p style={s.p}>Depending on your location, you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at the email below.</p>

      <h2 style={s.h}>Account deletion</h2>
      <p style={s.p}>You can delete your account and all associated data at any time from Profile › Delete Account within the app. Deletion is permanent and cannot be undone. All your data including chat history, decisions, and profile information will be removed.</p>

      <h2 style={s.h}>Children's privacy</h2>
      <p style={s.p}>Wavebound is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

      <h2 style={s.h}>Changes to this policy</h2>
      <p style={s.p}>We may update this policy from time to time. We will notify you of changes by updating the date at the top of this page.</p>

      <h2 style={s.h}>Contact</h2>
      <p style={s.p}>If you have questions about this policy or your data, email us at paul@wavebound.ai.</p>

      <div style={s.footer}>© 2026 Wavebound</div>
    </div>
  </div>
);

export default PrivacyPolicy;
