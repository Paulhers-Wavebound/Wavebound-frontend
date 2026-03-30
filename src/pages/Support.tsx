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
  link: { color: "#e8430a", textDecoration: "none", fontSize: 18, fontWeight: 600 } as const,
  q: { color: "rgba(255,255,255,0.87)", fontSize: 16, fontWeight: 600, margin: "24px 0 6px" } as const,
  footer: { color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center" as const, marginTop: 48, paddingBottom: 32 },
};

const Support = () => (
  <div style={s.page}>
    <SEOHead
      title="Support — Wavebound"
      description="Get help with your Wavebound account, content plan, or anything else in the app."
      canonical="/support"
    />
    <div style={s.wrap}>
      <Link to="/" style={s.brand}>Wavebound</Link>
      <h1 style={s.title}>Support</h1>

      <h2 style={s.h}>How can we help?</h2>
      <p style={s.p}>
        Wavebound is built for signed music artists on major labels. If you need help with your account,
        content plan, or anything else in the app, reach out and we'll get back to you within 24 hours.
      </p>
      <p style={{ margin: "0 0 48px" }}>
        <a href="mailto:contact@wavebound.ai" style={s.link}>contact@wavebound.ai</a>
      </p>

      <h2 style={s.h}>Common Questions</h2>

      <p style={s.q}>How do I get access?</p>
      <p style={s.p}>Wavebound accounts are provisioned by your label or management team. Contact your representative to get set up.</p>

      <p style={s.q}>How do I delete my account?</p>
      <p style={s.p}>Open the app, go to Profile, and tap "Delete Account" at the bottom. This permanently removes all your data.</p>

      <p style={s.q}>My content plan isn't loading</p>
      <p style={s.p}>Make sure you have an active internet connection and try pulling down to refresh. If the issue persists, contact us.</p>

      <p style={s.q}>How do I change my email or password?</p>
      <p style={s.p}>Go to Profile in the app and tap Email or Password to update your credentials.</p>

      <div style={s.footer}>© 2026 Wavebound</div>
    </div>
  </div>
);

export default Support;
