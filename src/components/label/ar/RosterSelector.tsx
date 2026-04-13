/**
 * RosterSelector — placeholder for future label-scoped roster filtering.
 * Currently unused since A&R pipeline shows global prospect pool.
 */
export default function RosterSelector({
  value: _value,
  onChange: _onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  // Will be wired to real label data when multi-label support is added
  return null;
}
