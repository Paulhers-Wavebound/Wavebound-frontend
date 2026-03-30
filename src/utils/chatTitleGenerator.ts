/**
 * Generates a concise chat session title from the user's first message.
 * Pure string manipulation — no AI calls.
 * Max 50 characters.
 */

const FILLER_PREFIXES = [
  /^hey\b[,!]?\s*/i,
  /^hi\b[,!]?\s*/i,
  /^hello\b[,!]?\s*/i,
  /^yo\b[,!]?\s*/i,
  /^please\b\s*/i,
  /^can you\b\s*/i,
  /^could you\b\s*/i,
  /^i want you to\b\s*/i,
  /^i need you to\b\s*/i,
  /^i'd like you to\b\s*/i,
  /^i want\b\s*/i,
  /^i need\b\s*/i,
  /^show me\b\s*/i,
  /^tell me\b\s*/i,
  /^help me\b\s*/i,
  /^give me\b\s*/i,
  /^let's\b\s*/i,
  /^let me\b\s*/i,
  /^i'm looking for\b\s*/i,
  /^do\b\s+/i,
];

/** Well-known quick-action patterns → short titles */
const QUICK_ACTION_PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  // "What sounds are trending in {genre} right now?"
  [/what\s+sounds?\s+(?:are\s+)?trending\s+in\s+(.+?)(?:\s+right\s+now)?[?.!]*$/i,
    (m) => `Trending ${capitalize(m[1])} Sounds`],
  // "What's trending in {genre}?"
  [/what(?:'s| is)\s+trending\s+in\s+(.+?)[?.!]*$/i,
    (m) => `Trending in ${capitalize(m[1])}`],
  // "Create a {N}-day content plan for {genre/role}"
  [/(?:create|make|build|generate)\s+(?:a\s+)?(\d+)[- ]day\s+(?:content\s+)?plan\s+(?:for\s+)?(?:an?\s+)?(.+?)[?.!]*$/i,
    (m) => `${m[1]}-Day ${capitalize(m[2])} Content Plan`],
  // "Do a deep analysis of {genre}"
  [/(?:deep|full|detailed)\s+analysis\s+(?:of|on|for)\s+(?:what(?:'s| is)\s+working\s+in\s+)?(.+?)[?.!]*$/i,
    (m) => `Deep Analysis: ${capitalize(m[1])}`],
  // "{N} hook ideas for {something}"
  [/(\d+)\s+hook\s+ideas?\s+(?:for\s+)?(?:an?\s+)?(.+?)[?.!]*$/i,
    (m) => `${m[1]} ${capitalize(m[2])} Hook Ideas`],
  // "hook ideas for {something}"
  [/hook\s+ideas?\s+(?:for\s+)?(?:an?\s+)?(.+?)[?.!]*$/i,
    (m) => `${capitalize(m[1])} Hook Ideas`],
  // "content plan for {genre/role}"
  [/content\s+plan\s+(?:for\s+)?(?:an?\s+)?(.+?)[?.!]*$/i,
    (m) => `${capitalize(m[1])} Content Plan`],
  // "what should I post before my {event}"
  [/what\s+should\s+i\s+post\s+(?:before|for|about)\s+(?:my\s+)?(.+?)[?.!]*$/i,
    (m) => `${capitalize(m[1])} Content Ideas`],
  // "analyze {something}"
  [/^analyze\s+(.+?)[?.!]*$/i,
    (m) => `Analysis: ${capitalize(m[1])}`],
];

function capitalize(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripFillerPrefixes(text: string): string {
  let result = text.trim();
  // Apply multiple passes since fillers can chain ("Hey, can you please...")
  for (let i = 0; i < 3; i++) {
    let changed = false;
    for (const pattern of FILLER_PREFIXES) {
      const stripped = result.replace(pattern, '');
      if (stripped !== result) {
        result = stripped;
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
  return result;
}

function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.4) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

export function generateChatTitle(message: string): string {
  if (!message || !message.trim()) return 'New Chat';

  // Strip filler words
  const cleaned = stripFillerPrefixes(message);
  if (!cleaned) return 'New Chat';

  // Try quick-action patterns first
  for (const [pattern, formatter] of QUICK_ACTION_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      const title = formatter(match);
      return truncateAtWord(title, 50);
    }
  }

  // Fallback: capitalize first letter, truncate at word boundary
  const sentence = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  // Remove trailing punctuation for cleaner titles
  const noPunct = sentence.replace(/[?.!,;:]+$/, '').trim();
  
  return truncateAtWord(noPunct, 50);
}
