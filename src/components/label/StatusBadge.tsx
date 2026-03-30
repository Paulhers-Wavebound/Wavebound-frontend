import { differenceInDays } from 'date-fns';

interface StatusBadgeProps {
  lastPostDate: string | null;
  postingFrequencyDays: number | null; // accepts any of the frequency columns
}

type Status = 'active' | 'slow' | 'attention';

function getStatus(lastPostDate: string | null, freqDays: number | null): Status {
  if (!lastPostDate) return 'attention';
  const days = differenceInDays(new Date(), new Date(lastPostDate));
  if (days < 7 || (freqDays !== null && freqDays < 7)) return 'active';
  if (days <= 14) return 'slow';
  return 'attention';
}

const styles: Record<Status, { label: string; bg: string; text: string; border: string }> = {
  active: { label: 'Active', bg: 'var(--green-light)', text: 'var(--green)', border: '#D1FAE5' },
  slow: { label: 'Slow', bg: 'var(--yellow-light)', text: 'var(--yellow)', border: '#FEF3C7' },
  attention: { label: 'Attention', bg: 'var(--red-light)', text: 'var(--red)', border: '#FECACA' },
};

export function StatusBadge({ lastPostDate, postingFrequencyDays }: StatusBadgeProps) {
  const status = getStatus(lastPostDate, postingFrequencyDays);
  const s = styles[status];

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 24, padding: '0 10px', borderRadius: 12,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.3px', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

export { getStatus };
