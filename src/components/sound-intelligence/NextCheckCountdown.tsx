import { useState, useEffect } from "react";

interface NextCheckCountdownProps {
  nextCheckAt: string | null;
}

function formatCountdown(nextCheckAt: string): string {
  const diffMs = new Date(nextCheckAt).getTime() - Date.now();
  if (diffMs <= 0) return "Checking now...";
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `Next check in ${hours}h ${mins % 60}m`;
  return `Next check in ${mins}m`;
}

export default function NextCheckCountdown({
  nextCheckAt,
}: NextCheckCountdownProps) {
  const [text, setText] = useState(() =>
    nextCheckAt ? formatCountdown(nextCheckAt) : "",
  );

  useEffect(() => {
    if (!nextCheckAt) return;
    setText(formatCountdown(nextCheckAt));
    const id = setInterval(() => setText(formatCountdown(nextCheckAt)), 60000);
    return () => clearInterval(id);
  }, [nextCheckAt]);

  if (!nextCheckAt || !text) return null;

  return (
    <span
      style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 11,
        color: "var(--ink-faint)",
      }}
    >
      {text}
    </span>
  );
}
