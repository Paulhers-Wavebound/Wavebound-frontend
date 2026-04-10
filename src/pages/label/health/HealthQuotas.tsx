import { useHealthData } from "./HealthLayout";
import ApiQuotaGauges from "@/components/admin/health/ApiQuotaGauges";
import QuotaHistoryChart from "./components/QuotaHistoryChart";
import { ProgressBar } from "@/components/admin/health/shared";
import { formatCompact } from "@/components/admin/health/helpers";

const OTHER_APIS = [
  {
    name: "Kworb",
    auth: "None",
    rateLimit: "1.5s delay",
    dailyQuota: "Unlimited",
    cost: "Free",
  },
  {
    name: "MusicBrainz",
    auth: "User-Agent",
    rateLimit: "1 req/s (strict)",
    dailyQuota: "Unlimited",
    cost: "Free",
  },
  {
    name: "Deezer",
    auth: "None",
    rateLimit: "50 req/5s",
    dailyQuota: "Unlimited",
    cost: "Free",
  },
  {
    name: "Last.fm",
    auth: "API key",
    rateLimit: "5 req/s",
    dailyQuota: "Unlimited",
    cost: "Free",
  },
  {
    name: "Genius",
    auth: "API key",
    rateLimit: "5 req/s",
    dailyQuota: "Unlimited",
    cost: "Free",
  },
  {
    name: "Bandsintown",
    auth: "None",
    rateLimit: "2 req/s",
    dailyQuota: "Unlimited",
    cost: "Free",
  },
  {
    name: "Wikipedia",
    auth: "None",
    rateLimit: "100 req/s",
    dailyQuota: "Unlimited",
    cost: "Free",
  },
];

const TM_KEYS = [
  { key: 1, status: "active" as const },
  { key: 2, status: "401" as const },
  { key: 3, status: "401" as const },
  { key: 4, status: "401" as const },
  { key: 5, status: "401" as const },
];

export default function HealthQuotas() {
  const { data } = useHealthData();
  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        API Quotas
      </h2>

      {/* Main quota gauges */}
      {data.api_quotas && <ApiQuotaGauges quotas={data.api_quotas} />}

      {/* SC credit history chart */}
      {data.api_quotas?.sc_credits?.history?.length >= 2 && (
        <QuotaHistoryChart history={data.api_quotas.sc_credits.history} />
      )}

      {/* SC burn rate detail */}
      {data.api_quotas?.sc_credits && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 12,
            }}
          >
            ScrapeCreators Detail
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 12,
            }}
          >
            {[
              {
                label: "Credits remaining",
                value:
                  data.api_quotas.sc_credits.latest_remaining != null
                    ? formatCompact(data.api_quotas.sc_credits.latest_remaining)
                    : "N/A",
              },
              {
                label: "Burn rate",
                value:
                  (data.api_quotas.sc_credits.burn_rate_daily ?? 0) > 0
                    ? `${formatCompact(data.api_quotas.sc_credits.burn_rate_daily)}/day`
                    : "No data",
              },
              {
                label: "Projected exhaustion",
                value:
                  data.api_quotas.sc_credits.projected_exhaustion_date || "N/A",
              },
              {
                label: "Cost per call",
                value: "$0.001",
              },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticketmaster keys */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          padding: "16px",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 12,
          }}
        >
          Ticketmaster Discovery API
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {TM_KEYS.map((k) => (
            <div
              key={k.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${k.status === "active" ? "rgba(52, 211, 153, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                background:
                  k.status === "active"
                    ? "rgba(52, 211, 153, 0.06)"
                    : "rgba(239, 68, 68, 0.06)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: k.status === "active" ? "#34d399" : "#ef4444",
                }}
              />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  color: k.status === "active" ? "#34d399" : "#ef4444",
                  fontWeight: 600,
                }}
              >
                Key {k.key}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                }}
              >
                {k.status === "active" ? "5K/day" : "401 error"}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-faint)",
            fontStyle: "italic",
          }}
        >
          Keys 2-5 need regeneration in the Ticketmaster developer portal
        </div>
      </div>

      {/* Other APIs reference */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Other APIs
          </span>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              {["API", "Auth", "Rate Limit", "Daily Quota", "Cost"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OTHER_APIS.map((api) => (
              <tr key={api.name}>
                <td
                  style={{
                    padding: "7px 16px",
                    color: "var(--ink)",
                    fontWeight: 500,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {api.name}
                </td>
                <td
                  style={{
                    padding: "7px 16px",
                    color: "var(--ink-secondary)",
                    fontSize: 11,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {api.auth}
                </td>
                <td
                  style={{
                    padding: "7px 16px",
                    color: "var(--ink-secondary)",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {api.rateLimit}
                </td>
                <td
                  style={{
                    padding: "7px 16px",
                    color: "var(--ink-secondary)",
                    fontSize: 11,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {api.dailyQuota}
                </td>
                <td
                  style={{
                    padding: "7px 16px",
                    color: "var(--ink-faint)",
                    fontSize: 11,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {api.cost}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
