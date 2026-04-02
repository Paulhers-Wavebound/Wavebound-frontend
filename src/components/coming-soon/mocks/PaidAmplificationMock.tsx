import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  DollarSign,
  Eye,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
} from "lucide-react";

/* ─── Mock data ─── */

const PAID_ORGANIC = [
  { name: "Organic", value: 86, color: "#30D158" },
  { name: "Paid", value: 14, color: "#e8430a" },
];

const CAMPAIGN_TIMELINE = [
  { day: "Mar 10", paid: 0, organic: 4200 },
  { day: "Mar 11", paid: 0, organic: 3800 },
  { day: "Mar 12", paid: 2400, organic: 4100 },
  { day: "Mar 13", paid: 3100, organic: 4500 },
  { day: "Mar 14", paid: 2800, organic: 3900 },
  { day: "Mar 15", paid: 1200, organic: 4300 },
  { day: "Mar 16", paid: 0, organic: 3600 },
  { day: "Mar 17", paid: 0, organic: 3200 },
  { day: "Mar 18", paid: 0, organic: 3800 },
  { day: "Mar 19", paid: 0, organic: 4100 },
  { day: "Mar 20", paid: 0, organic: 3700 },
  { day: "Mar 21", paid: 0, organic: 3400 },
  { day: "Mar 22", paid: 1800, organic: 4600 },
  { day: "Mar 23", paid: 3400, organic: 5100 },
  { day: "Mar 24", paid: 2900, organic: 4800 },
  { day: "Mar 25", paid: 1100, organic: 4200 },
];

const CAMPAIGNS = [
  {
    name: "Wave 1 — Micro-influencer push",
    dates: "Mar 12–15",
    creators: 8,
    estSpend: "$12,400",
    reach: "5.2M views",
    engagement: "7.8%",
    status: "completed",
  },
  {
    name: "Wave 2 — Dance challenge seed",
    dates: "Mar 22–25",
    creators: 14,
    estSpend: "$18,600",
    reach: "8.1M views",
    engagement: "8.4%",
    status: "completed",
  },
  {
    name: "Wave 3 — Always-on boost",
    dates: "Mar 26–ongoing",
    creators: 3,
    estSpend: "$4,200/week",
    reach: "900K views",
    engagement: "9.1%",
    status: "active",
  },
];

const TOP_PAID = [
  {
    handle: "@dancewithlena",
    estCost: "$4,200",
    posts: 3,
    totalViews: "2.2M",
    engagement: "12.3%",
  },
  {
    handle: "@lifewithmarc",
    estCost: "$3,800",
    posts: 2,
    totalViews: "1.4M",
    engagement: "9.7%",
  },
  {
    handle: "@jessicafit.uk",
    estCost: "$2,100",
    posts: 2,
    totalViews: "890K",
    engagement: "11.2%",
  },
  {
    handle: "@trendsetter.jay",
    estCost: "$1,800",
    posts: 1,
    totalViews: "720K",
    engagement: "8.4%",
  },
  {
    handle: "@vibesonly.zoe",
    estCost: "$1,500",
    posts: 1,
    totalViews: "540K",
    engagement: "10.1%",
  },
];

const SUSPICIOUS = {
  accounts: 12,
  created: "within 30 days",
  pattern: "Identical clip format, same posting cadence",
  flag: "Potential seeding operation",
};

/* ─── Helpers ─── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface, #1C1C1E)",
        borderRadius: 12,
        border: "1px solid var(--border, rgba(255,255,255,0.06))",
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 3,
          height: 14,
          borderRadius: 1,
          background:
            "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
        }}
      />
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
          textTransform: "uppercase",
          letterSpacing: "0.10em",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Icon
          size={16}
          style={{ color: accent ? "#FF453A" : "#e8430a", opacity: 0.8 }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "var(--ink, rgba(255,255,255,0.87))",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-secondary, rgba(255,255,255,0.55))",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </Card>
  );
}

/* ─── Main Component ─── */

export default function PaidAmplificationMock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Hero stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        <StatBox
          icon={Eye}
          label="Total Paid Reach"
          value="14.2M"
          sub="Across 3 campaigns"
        />
        <StatBox
          icon={DollarSign}
          label="Est. Total Spend"
          value="$35,200"
          sub="$2.48 CPM"
        />
        <StatBox
          icon={TrendingUp}
          label="Paid Engagement"
          value="8.1%"
          sub="28% below organic avg"
        />
        <StatBox
          icon={Users}
          label="Paid Creators"
          value="25"
          sub="3 active campaigns"
        />
        <StatBox
          icon={Calendar}
          label="Active Since"
          value="Mar 12"
          sub="2 completed waves"
        />
        <StatBox
          icon={AlertTriangle}
          label="Flags"
          value="1"
          sub="Seeding cluster detected"
          accent
        />
      </div>

      {/* Paid vs Organic pie + campaign timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
        <div>
          <SectionLabel>Paid vs Organic Split</SectionLabel>
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={PAID_ORGANIC}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1000}
                  >
                    {PAID_ORGANIC.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 8,
                }}
              >
                {PAID_ORGANIC.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: d.color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                      }}
                    >
                      {d.name} {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <SectionLabel>Campaign Activity Timeline</SectionLabel>
          <Card>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={CAMPAIGN_TIMELINE}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1C1C1E",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.87)",
                  }}
                />
                <Bar
                  dataKey="organic"
                  stackId="a"
                  fill="#30D158"
                  fillOpacity={0.6}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="paid"
                  stackId="a"
                  fill="#e8430a"
                  fillOpacity={0.8}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Detected campaigns */}
      <div>
        <SectionLabel>Detected Campaign Waves</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 12,
          }}
        >
          {CAMPAIGNS.map((c) => (
            <Card key={c.name}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--ink, rgba(255,255,255,0.87))",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                      marginTop: 4,
                    }}
                  >
                    {c.dates} · {c.creators} creators · Est. {c.estSpend}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink, rgba(255,255,255,0.87))",
                      }}
                    >
                      {c.reach}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#30D158",
                        fontWeight: 500,
                      }}
                    >
                      {c.engagement} eng
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      background:
                        c.status === "active"
                          ? "rgba(232,67,10,0.15)"
                          : "rgba(255,255,255,0.06)",
                      color:
                        c.status === "active"
                          ? "#e8430a"
                          : "var(--ink-tertiary, rgba(255,255,255,0.45))",
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Top paid creators table */}
      <div>
        <SectionLabel>Top Paid Creators</SectionLabel>
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Creator",
                  "Est. Cost",
                  "Posts",
                  "Total Views",
                  "Engagement",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom:
                        "1px solid var(--border, rgba(255,255,255,0.06))",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_PAID.map((c) => (
                <tr key={c.handle}>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#e8430a",
                      borderBottom:
                        "1px solid var(--border, rgba(255,255,255,0.06))",
                    }}
                  >
                    {c.handle}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink, rgba(255,255,255,0.87))",
                      fontVariantNumeric: "tabular-nums",
                      borderBottom:
                        "1px solid var(--border, rgba(255,255,255,0.06))",
                    }}
                  >
                    {c.estCost}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: 13,
                      color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                      borderBottom:
                        "1px solid var(--border, rgba(255,255,255,0.06))",
                    }}
                  >
                    {c.posts}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink, rgba(255,255,255,0.87))",
                      fontVariantNumeric: "tabular-nums",
                      borderBottom:
                        "1px solid var(--border, rgba(255,255,255,0.06))",
                    }}
                  >
                    {c.totalViews}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#30D158",
                      borderBottom:
                        "1px solid var(--border, rgba(255,255,255,0.06))",
                    }}
                  >
                    {c.engagement}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Suspicious activity flag */}
      <div>
        <SectionLabel>Anomaly Detection</SectionLabel>
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "4px 0",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(255,69,58,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} style={{ color: "#FF453A" }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#FF453A",
                  marginBottom: 4,
                }}
              >
                {SUSPICIOUS.flag}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                  lineHeight: 1.5,
                }}
              >
                {SUSPICIOUS.accounts} accounts detected, all created{" "}
                {SUSPICIOUS.created}. {SUSPICIOUS.pattern}. Recommend manual
                review before amplifying content from this cluster.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
