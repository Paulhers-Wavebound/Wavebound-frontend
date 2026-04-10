import { Mail, MessageCircle, BookOpen, ExternalLink } from "lucide-react";

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I add artists to my roster?",
    a: "Go to the Dashboard and use the \"Add Artist\" button. Enter the artist's TikTok handle and we'll start collecting data automatically.",
  },
  {
    q: "How does Sound Intelligence work?",
    a: "Paste a TikTok sound URL and we analyze up to 1,000 videos using that sound. You'll get format breakdowns, creator tiers, geography insights, and actionable recommendations.",
  },
  {
    q: "How do I invite team members?",
    a: "Go to Settings and copy your invite code. Share it with your team — they can sign up at the join link and will automatically be added to your label.",
  },
  {
    q: "What does the engagement rate measure?",
    a: "Engagement rate is calculated as likes divided by views. The platform average is around 1%, so anything above that indicates strong performance.",
  },
  {
    q: "How often is data refreshed?",
    a: "Artist dashboard metrics are refreshed on demand. Sound Intelligence analyses are point-in-time snapshots — run a new analysis anytime for fresh data.",
  },
  {
    q: "Can I export data?",
    a: "Export functionality is coming soon. For now, you can use the data directly in the dashboard for presentations and strategy sessions.",
  },
];

export default function LabelHelp() {
  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 24,
            fontWeight: 700,
            color: "var(--ink)",
          }}
        >
          Help & Support
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
            marginTop: 4,
          }}
        >
          Get answers or reach out to the Wavebound team.
        </div>
      </div>

      {/* Contact cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        <ContactCard
          icon={Mail}
          title="Email Support"
          description="Get a response within 24 hours"
          action="contact@wavebound.ai"
          href="mailto:contact@wavebound.ai"
        />
        <ContactCard
          icon={MessageCircle}
          title="Live Chat"
          description="Coming soon"
          action={null}
          href={null}
        />
        <ContactCard
          icon={BookOpen}
          title="Documentation"
          description="Coming soon"
          action={null}
          href={null}
        />
      </div>

      {/* FAQ */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            Frequently Asked Questions
          </div>
        </div>
        <div style={{ height: 1, background: "var(--border)" }} />

        {FAQ.map((item, i) => (
          <div
            key={i}
            style={{
              padding: "18px 24px",
              background:
                i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
              borderBottom:
                i < FAQ.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: 6,
              }}
            >
              {item.q}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
              }}
            >
              {item.a}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  description,
  action,
  href,
}: {
  icon: any;
  title: string;
  description: string;
  action: string | null;
  href: string | null;
}) {
  const isDisabled = !href;
  const content = (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: isDisabled ? 0.5 : 1,
        transition: "all 150ms",
        cursor: isDisabled ? "default" : "pointer",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: isDisabled
            ? "rgba(255,255,255,0.04)"
            : "rgba(232,67,10,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={20}
          style={{ color: isDisabled ? "var(--ink-tertiary)" : "#e8430a" }}
        />
      </div>
      <div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-tertiary)",
          }}
        >
          {description}
        </div>
      </div>
      {action && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: "auto",
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: "#e8430a",
            }}
          >
            {action}
          </span>
          <ExternalLink size={14} style={{ color: "#e8430a" }} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none" }}>
        {content}
      </a>
    );
  }
  return content;
}
