/**
 * Expansion Radar preview — uses REAL sub-components with
 * Harry Styles mock data that makes Warner think "holy shit."
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, ChevronDown } from "lucide-react";
import ExpansionStats from "@/components/label/expansion/ExpansionStats";
import GeoMap from "@/components/label/expansion/GeoMap";
import OpportunityCard from "@/components/label/expansion/OpportunityCard";
import LanguageSignal from "@/components/label/expansion/LanguageSignal";
import NicheProof from "@/components/label/expansion/NicheProof";
import RevenueEstimate from "@/components/label/expansion/RevenueEstimate";
import type {
  ExpansionArtist,
  CityData,
  ExpansionOpportunity,
  LanguageData,
  NicheProofItem,
} from "@/components/label/expansion/mockData";

/* ══════════════════════════════════════════════════════════════
   Harry Styles — Expansion Radar Mock Data
   "American Girls" era, massive global footprint but with
   specific untapped markets that make Warner think $$$
   ══════════════════════════════════════════════════════════════ */

const artist: ExpansionArtist = {
  handle: "harrystyles",
  name: "Harry Styles",
  label: "Warner Music UK",
  monthly_listeners: 58_400_000,
  monthly_listeners_change_pct: 14,
  markets_reached: 92,
  new_markets_this_month: 7,
  untapped_markets: 11,
  estimated_missed_reach: 12_600_000,
};

const cities: CityData[] = [
  {
    city: "London",
    country: "UK",
    country_code: "GB",
    flag: "🇬🇧",
    listeners: 4_820_000,
    pct_of_total: 8.3,
    status: "strong",
  },
  {
    city: "New York",
    country: "US",
    country_code: "US",
    flag: "🇺🇸",
    listeners: 3_940_000,
    pct_of_total: 6.7,
    status: "strong",
  },
  {
    city: "Los Angeles",
    country: "US",
    country_code: "US",
    flag: "🇺🇸",
    listeners: 3_210_000,
    pct_of_total: 5.5,
    status: "strong",
  },
  {
    city: "São Paulo",
    country: "Brazil",
    country_code: "BR",
    flag: "🇧🇷",
    listeners: 2_640_000,
    pct_of_total: 4.5,
    status: "strong",
  },
  {
    city: "Mexico City",
    country: "Mexico",
    country_code: "MX",
    flag: "🇲🇽",
    listeners: 1_890_000,
    pct_of_total: 3.2,
    status: "strong",
  },
  {
    city: "Paris",
    country: "France",
    country_code: "FR",
    flag: "🇫🇷",
    listeners: 1_720_000,
    pct_of_total: 2.9,
    status: "strong",
  },
  {
    city: "Jakarta",
    country: "Indonesia",
    country_code: "ID",
    flag: "🇮🇩",
    listeners: 890_000,
    pct_of_total: 1.5,
    status: "growing",
  },
  {
    city: "Istanbul",
    country: "Turkey",
    country_code: "TR",
    flag: "🇹🇷",
    listeners: 640_000,
    pct_of_total: 1.1,
    status: "growing",
  },
  {
    city: "Mumbai",
    country: "India",
    country_code: "IN",
    flag: "🇮🇳",
    listeners: 420_000,
    pct_of_total: 0.7,
    status: "growing",
  },
  {
    city: "Lagos",
    country: "Nigeria",
    country_code: "NG",
    flag: "🇳🇬",
    listeners: 180_000,
    pct_of_total: 0.3,
    status: "untapped",
  },
];

const opportunities: ExpansionOpportunity[] = [
  {
    id: "h1",
    flag: "🇮🇩",
    market_name: "Indonesia",
    region: "Jakarta · Surabaya · Bandung",
    cities: ["Jakarta", "Surabaya", "Bandung"],
    priority: "high",
    comparable_avg_listeners: 4_200_000,
    artist_current_listeners: 890_000,
    comment_signal_pct: 24,
    confidence_pct: 94,
    gos_score: 92,
    projected_monthly_revenue: 86_000,
    evidence: [
      "24% of TikTok comments on American Girls are in Indonesian — fastest-growing language segment",
      "Indonesian creators produced 12,400 videos using the sound in the last 14 days alone",
      "Comparable artist Olivia Rodrigo has 4.2M Indonesian listeners — Harry is at 890K, a 4.7x gap",
      "Lip Sync / Dance format is 3.8x more popular in Indonesia than global avg — matches American Girls' #1 format",
    ],
    strategy:
      "Indonesia is the single biggest unlock. Seed 5 Indonesian micro-creators (10K–50K) with early chorus clip. Indonesian fans respond to emotional + dance hybrid content — American Girls fits perfectly. Post at 7–9pm WIB. Target Spotify Indonesia's 'Pop Hits' and 'Viral Indonesia' playlists. Potential: 3.3M additional listeners within 6 months.",
  },
  {
    id: "h2",
    flag: "🇹🇷",
    market_name: "Turkey",
    region: "Istanbul · Ankara · Izmir",
    cities: ["Istanbul", "Ankara", "Izmir"],
    priority: "high",
    comparable_avg_listeners: 3_800_000,
    artist_current_listeners: 640_000,
    comment_signal_pct: 18,
    confidence_pct: 91,
    gos_score: 88,
    projected_monthly_revenue: 72_000,
    evidence: [
      "Turkish Aesthetic Edit content using American Girls grew +340% week-over-week",
      "18% of comments are in Turkish — up from 4% three weeks ago",
      "Turkey is the #1 market for Aesthetic Edit format globally — this is Harry's fastest-growing format",
      "Comparable artist Dua Lipa has 3.8M Turkish listeners with similar demographic profile",
    ],
    strategy:
      "Turkey is exploding organically. The Aesthetic Edit format is already native to Turkish TikTok culture. Boost by seeding 3 Istanbul-based fashion/lifestyle creators. Turkish audiences over-index on sunset + nostalgia content — lean into American Girls' golden hour aesthetic. Post at 8–10pm TRT.",
  },
  {
    id: "h3",
    flag: "🇮🇳",
    market_name: "India",
    region: "Mumbai · Delhi · Bangalore · Hyderabad",
    cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"],
    priority: "high",
    comparable_avg_listeners: 6_400_000,
    artist_current_listeners: 420_000,
    comment_signal_pct: 12,
    confidence_pct: 88,
    gos_score: 86,
    projected_monthly_revenue: 124_000,
    evidence: [
      "India is Spotify's fastest-growing market globally (+62% YoY) — Harry has only 420K vs comparable avg of 6.4M",
      "12% of comments are in Hindi/regional languages, growing steadily",
      "Indian Instagram Reels are cross-pollinating — American Girls appearing on Reels with 48hr TikTok lag",
      "Bollywood-adjacent emotional pop resonates — 'nostalgia' is the #1 comment keyword in Hindi comments",
    ],
    strategy:
      "India is the highest revenue opportunity. 15.2x gap between Harry's current listeners and comparable avg. Indian audiences discover through emotional content — pair American Girls with monsoon/train aesthetic edits. Seed with 5 Bollywood fan account creators who already post Western pop content. Post at 8–10pm IST. Target Spotify India's 'Pop Rising' and 'English Hits India' playlists.",
  },
  {
    id: "h4",
    flag: "🇳🇬",
    market_name: "West Africa",
    region: "Lagos · Accra · Nairobi",
    cities: ["Lagos", "Accra", "Nairobi"],
    priority: "medium",
    comparable_avg_listeners: 1_800_000,
    artist_current_listeners: 180_000,
    comment_signal_pct: 8,
    confidence_pct: 76,
    gos_score: 71,
    projected_monthly_revenue: 34_000,
    evidence: [
      "African TikTok is growing at 89% YoY — fastest regional growth globally",
      "8% of comments are in Nigerian Pidgin/Yoruba — small but doubling month-over-month",
      "Afrobeats x Western Pop crossover is the hottest format — American Girls' rhythm fits the dance trend",
      "Comparable artist Ed Sheeran grew from 200K → 1.8M Nigerian listeners via a single viral dance challenge",
    ],
    strategy:
      "Lower confidence but massive potential. Test with 2 Lagos-based dance creators — Nigerian TikTok responds to challenge formats. If the first wave hits 500K views, scale immediately. The Afrobeats crossover audience is worth the experiment. Post at 7–9pm WAT.",
  },
];

const languages: LanguageData[] = [
  { language: "English", flag: "🇬🇧", pct: 42, color: "#30D158" },
  { language: "Indonesian", flag: "🇮🇩", pct: 18, color: "#e8430a" },
  { language: "Turkish", flag: "🇹🇷", pct: 14, color: "#e8430a" },
  { language: "Portuguese", flag: "🇧🇷", pct: 10, color: "#30D158" },
  { language: "Hindi", flag: "🇮🇳", pct: 8, color: "#FFD60A" },
  { language: "Spanish", flag: "🇪🇸", pct: 5, color: "#30D158" },
  { language: "Pidgin English", flag: "🇳🇬", pct: 3, color: "#FFD60A" },
];

const nicheProof: NicheProofItem[] = [
  {
    artist: "Olivia Rodrigo",
    description:
      "Indonesian dance challenge using 'vampire' chorus — 4,200 creators in Jakarta alone participated. 72% of views from Indonesia. Went from 1.2M → 4.2M Indonesian listeners in 8 weeks.",
    views: "18.4M views",
    market_badge: "🇮🇩 Indonesia Explosion",
    format: "Dance Challenge",
  },
  {
    artist: "Dua Lipa",
    description:
      "Turkish sunset aesthetic edit using 'Levitating' — the format that built her 3.8M Turkish audience. Aesthetic Edit + nostalgic sound = the exact combo American Girls dominates.",
    views: "12.1M views",
    market_badge: "🇹🇷 Turkey Blueprint",
    format: "Aesthetic Edit",
  },
  {
    artist: "Ed Sheeran",
    description:
      "Lagos dance challenge with 'Shape of You' — a single Nigerian creator's video triggered 1,800 duets in 72 hours. Proof that one viral moment can unlock an entire continent.",
    views: "8.7M views",
    market_badge: "🇳🇬 West Africa Breakout",
    format: "Dance Challenge",
  },
  {
    artist: "The Weeknd",
    description:
      "Bollywood-style emotional edit using 'Blinding Lights' on Indian Reels. Crossed over from Instagram → Spotify India playlist placement. 5.2M Indian listeners within 3 months.",
    views: "24.6M views",
    market_badge: "🇮🇳 India Crossover",
    format: "Emotional Edit",
  },
];

const revenue = [
  {
    market: "🇮🇳",
    label: "India Potential",
    value: 124_000,
    subtext: "/month in additional streams",
  },
  {
    market: "🇮🇩",
    label: "Indonesia Potential",
    value: 86_000,
    subtext: "/month in additional streams",
  },
  {
    market: "🇹🇷",
    label: "Turkey Potential",
    value: 72_000,
    subtext: "/month in additional streams",
  },
  {
    market: "🇳🇬",
    label: "West Africa Potential",
    value: 34_000,
    subtext: "/month in additional streams",
  },
];

/* ─── SectionLabel (matches real page) ─── */

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

/* ─── Main Component ─── */

export default function ExpansionRadarMock() {
  const [highlightedMarket, setHighlightedMarket] = useState<string | null>(
    null,
  );
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleSelectMarket = useCallback((market: string | null) => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    if (!market) {
      setHighlightedMarket(null);
      return;
    }
    const slug = market.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const el = document.getElementById(`opportunity-${slug}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMarket(market);
      highlightTimeoutRef.current = setTimeout(
        () => setHighlightedMarket(null),
        3000,
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current)
        clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-faint, rgba(255,255,255,0.4))",
            }}
          >
            Warner Music UK
          </span>
          <ChevronRight
            size={14}
            color="var(--ink-faint, rgba(255,255,255,0.25))"
            strokeWidth={1.5}
          />
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-secondary, rgba(255,255,255,0.6))",
              fontWeight: 500,
            }}
          >
            Harry Styles
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 8,
              }}
            >
              <h1
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 38,
                  fontWeight: 800,
                  color: "var(--ink, rgba(255,255,255,0.92))",
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                Expansion Radar
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--green, #30D158)",
                  background: "rgba(48, 209, 88, 0.1)",
                  border: "1px solid rgba(48, 209, 88, 0.2)",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--green, #30D158)",
                    animation: "livePulse 2s ease-in-out infinite",
                  }}
                />
                Live
              </span>
            </div>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                margin: 0,
                maxWidth: 640,
                lineHeight: 1.5,
              }}
            >
              Untapped audiences Harry could reach — based on intelligence from
              110,000+ TikTok videos, cross-platform signals, and 2,400
              comparable artists.
            </p>
          </div>

          {/* Artist selector (static) */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--surface, #1C1C1E)",
                border:
                  "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                borderRadius: 12,
                padding: "10px 16px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--accent, #e8430a) 0%, #ff6b3d 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                H
              </div>
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink, rgba(255,255,255,0.87))",
                  }}
                >
                  Harry Styles
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-faint, rgba(255,255,255,0.35))",
                  }}
                >
                  @harrystyles
                </div>
              </div>
              <ChevronDown
                size={14}
                color="var(--ink-tertiary, rgba(255,255,255,0.35))"
                strokeWidth={2}
                style={{ marginLeft: 4 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SectionLabel>Overview</SectionLabel>
        <div style={{ marginTop: 14 }}>
          <ExpansionStats artist={artist} />
        </div>
      </motion.div>

      {/* Geo map */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <SectionLabel>Geographic Distribution</SectionLabel>
        <div style={{ marginTop: 14 }}>
          <GeoMap cities={cities} onSelectMarket={handleSelectMarket} />
        </div>
      </motion.div>

      {/* Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <SectionLabel>Expansion Opportunities</SectionLabel>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {opportunities.map((opp, i) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              index={i}
              highlighted={highlightedMarket === opp.market_name}
              defaultExpanded={i < 2}
            />
          ))}
        </div>
      </motion.div>

      {/* Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <SectionLabel>Revenue Left on Table</SectionLabel>
        <div style={{ marginTop: 14 }}>
          <RevenueEstimate items={revenue} />
        </div>
      </motion.div>

      {/* Language */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <SectionLabel>Audience Language Signal</SectionLabel>
        <div style={{ marginTop: 14 }}>
          <LanguageSignal languages={languages} />
        </div>
      </motion.div>

      {/* Niche proof */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <SectionLabel>Niche Evidence — What Works</SectionLabel>
        <div style={{ marginTop: 14 }}>
          <NicheProof items={nicheProof} />
        </div>
      </motion.div>

      {/* CTA banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        style={{
          background:
            "linear-gradient(135deg, rgba(232,67,10,0.12) 0%, rgba(232,67,10,0.04) 100%)",
          border: "1px solid rgba(232,67,10,0.2)",
          borderRadius: 20,
          padding: "32px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ink, rgba(255,255,255,0.87))",
              margin: "0 0 6px",
            }}
          >
            $316K/month in untapped streaming revenue
          </h3>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              color: "var(--ink-tertiary, rgba(255,255,255,0.5))",
              margin: 0,
            }}
          >
            Generate a market-specific content plan for Harry across Indonesia,
            Turkey, India, and West Africa.
          </p>
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent, #e8430a)",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            cursor: "pointer",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          Generate Expansion Plan
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </motion.div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
