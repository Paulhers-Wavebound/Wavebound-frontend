const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://kxvgbowrkmowuyezoeke.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAGE_SIZE = 1000;

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_KEY is required for sound URL health checks.");
  process.exit(1);
}

function canonicalSoundUrl(soundId) {
  return `https://www.tiktok.com/music/${soundId}`;
}

function normalize(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchPage(table, select, offset) {
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  url.searchParams.set("select", select);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("order", "id.asc");

  const response = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${table} query failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function fetchAllRows(table, select) {
  const rows = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage(table, select, offset);
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

function findUrlProblems(table, rows) {
  return rows.flatMap((row) => {
    const soundId = normalize(row.sound_id);
    const soundUrl = normalize(row.sound_url);

    if (!soundId) {
      return soundUrl
        ? [
            {
              table,
              id: row.id,
              kind: "missing_sound_id",
              soundId,
              soundUrl,
              expectedUrl: null,
            },
          ]
        : [];
    }

    const expectedUrl = canonicalSoundUrl(soundId);
    if (soundUrl === expectedUrl) {
      return [];
    }

    return [
      {
        table,
        id: row.id,
        kind: soundUrl ? "noncanonical_sound_url" : "missing_sound_url",
        soundId,
        soundUrl,
        expectedUrl,
      },
    ];
  });
}

const checks = [
  {
    table: "sound_intelligence_jobs",
    select: "id,sound_id,sound_url",
  },
  {
    table: "sound_canonical_group_members",
    select: "id,group_id,job_id,sound_id,sound_url",
  },
];

const results = [];

for (const check of checks) {
  const rows = await fetchAllRows(check.table, check.select);
  results.push({
    table: check.table,
    checked: rows.length,
    problems: findUrlProblems(check.table, rows),
  });
}

const problems = results.flatMap((result) => result.problems);

if (problems.length > 0) {
  console.error(`Sound URL health failed: ${problems.length} malformed rows.`);
  for (const problem of problems.slice(0, 20)) {
    console.error(
      [
        problem.table,
        problem.id,
        problem.kind,
        `sound_id=${problem.soundId || "(blank)"}`,
        `sound_url=${problem.soundUrl || "(blank)"}`,
        `expected=${problem.expectedUrl || "(none)"}`,
      ].join(" | "),
    );
  }
  if (problems.length > 20) {
    console.error(`...and ${problems.length - 20} more.`);
  }
  process.exit(1);
}

const summary = results
  .map((result) => `${result.table}: ${result.checked} checked`)
  .join("; ");
console.log(`Sound URL health passed: ${summary}.`);
