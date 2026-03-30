interface PlanCardProps {
  artistName: string;
  planTitle: string;
  status: 'delivered' | 'in_progress' | 'not_started';
  posted: number;
  total: number;
}

const statusStyles = {
  delivered: { label: 'Delivered', bg: 'var(--green-light)', color: 'var(--green)' },
  in_progress: { label: 'In Progress', bg: 'var(--yellow-light)', color: 'var(--yellow)' },
  not_started: { label: 'Not Started', bg: 'var(--bg)', color: 'var(--ink-tertiary)' },
};

export function PlanCard({ artistName, planTitle, status, posted, total }: PlanCardProps) {
  const s = statusStyles[status];
  const pct = total > 0 ? (posted / total) * 100 : 0;

  return (
    <div
      style={{
        width: 280, flexShrink: 0,
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)', padding: 20,
        transition: 'box-shadow 200ms ease, transform 200ms ease',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 15, color: 'var(--ink)' }}>
        {artistName}
      </div>
      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-secondary)', marginTop: 4 }}>
        {planTitle}
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 10px', borderRadius: 10,
          background: s.bg, color: s.color,
          fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600,
        }}>
          {s.label}
        </span>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 6 }}>
          {posted}/{total} posted
        </div>
        <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--bg)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 2,
            background: pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)',
            transition: 'width 300ms ease',
          }} />
        </div>
      </div>

      <div style={{
        marginTop: 16, fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500,
        color: 'var(--accent)', cursor: 'pointer',
      }}>
        View Plan →
      </div>
    </div>
  );
}
