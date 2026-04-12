/* Shared helpers for artist tab components — Premium editorial design */

export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return Math.round(n).toLocaleString();
}

export function pctStr(n: number | null | undefined, showPlus = true): string {
  if (n == null) return "—";
  const sign = showPlus && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function trendColor(n: number | null | undefined): string | undefined {
  if (n == null) return undefined;
  if (n > 0) return "#30D158";
  if (n < -5) return "#FF453A";
  return undefined;
}

export function StatChip({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "rgba(255,255,255,0.30)",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 17,
          fontWeight: 600,
          color: color || "rgba(255,255,255,0.87)",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "rgba(255,255,255,0.20)",
            lineHeight: 1,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  children,
  className,
  noPadding,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl ${className || ""}`}
      style={{
        background: "#1C1C1E",
        borderTop: "0.5px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ padding: noPadding ? "20px 24px 0" : "24px 24px 24px" }}>
        <h3
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.30)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 20,
          }}
        >
          {title}
        </h3>
        {!noPadding && children}
      </div>
      {noPadding && <div style={{ padding: "0 24px 24px" }}>{children}</div>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p
      style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 13,
        color: "rgba(255,255,255,0.20)",
        fontStyle: "italic",
        padding: "8px 0",
      }}
    >
      {message}
    </p>
  );
}

export function SubScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex-1 min-w-[100px]">
      <div className="flex justify-between items-baseline mb-1.5">
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: 500,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.87)",
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            borderRadius: 2,
            background: color,
            transition: "width 700ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

export function PlatformTrendPill({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value == null) return null;
  const color = value > 0 ? "#30D158" : value < -5 ? "#FF453A" : "#8E8E93";
  const arrow = value > 0 ? "\u2191" : value < 0 ? "\u2193" : "\u2192";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        fontWeight: 500,
        color,
        background: `${color}10`,
        padding: "3px 8px",
        borderRadius: 6,
      }}
    >
      {label}{" "}
      <span>
        {arrow}
        {Math.abs(value).toFixed(1)}%
      </span>
    </span>
  );
}

export function Gauge({
  label,
  value,
  color,
  size = 72,
}: {
  label: string;
  value: number;
  color: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div className="text-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="3"
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)" }}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: size * 0.26,
            fontWeight: 700,
            fill: "rgba(255,255,255,0.87)",
          }}
        >
          {value}
        </text>
      </svg>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          fontWeight: 500,
          color: "rgba(255,255,255,0.30)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** AI narrative text — editorial serif font for AI-generated content */
export function AIText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
        fontSize: 15,
        lineHeight: 1.7,
        letterSpacing: "0.005em",
        color: "rgba(255,255,255,0.75)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </div>
  );
}

const regionNamesIntl = new Intl.DisplayNames(["en"], { type: "region" });
export function countryName(code: string): string {
  try {
    return regionNamesIntl.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}
