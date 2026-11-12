export const LIVE_URL =
  "https://gist.githubusercontent.com/gtmcknight/594c47336546c8763e641b46cf9af4ec/raw/results.json";
export const FALLBACK_URL = "./results.json";

export type Stage = "unread" | "read1" | "read2" | "round3" | "final";

export interface Read {
  item?: string;
  judge: string;
  model?: string | null;
  record?: string | null;
  blocked?: string | null;
  useful: number;
  reliable: number;
  polish: number;
  creative: number;
  beyond: number;
  total: number | null;
  best?: string | null;
  worst?: string | null;
  validate?: string | null;
  inside?: string | null;
  tests?: string | null;
  rank?: number | null;
  round?: number | null;
}

export interface Demo {
  url: string;
  handle?: string | null;
  text?: string | null;
}

export interface Final {
  place: number;
  mean_rank: number;
  firsts: number;
  why?: string[] | string | null;
}

export interface Plugin {
  pr: number;
  name: string;
  author: string;
  pr_url: string;
  repo?: string | null;
  sha?: string | null;
  folder?: string | null;
  shelf?: string | null;
  tags?: string[] | null;
  listed?: boolean;
  does: string;
  stage: Stage;
  score: number | null;
  standing: number | null;
  round3?: { score?: number | null; rank?: number | null } | null;
  final?: Final | null;
  demo?: Demo | null;
  reads?: Read[] | null;
}

export interface Round {
  agents: number;
  plugins: number;
}

export interface Results {
  status?: string;
  updated?: string;
  note?: string;
  disclosure?: string;
  rounds: { read1: Round; read2: Round; round3: Round; final: Round };
  judges: Record<string, { reads: number; share_27_up?: number; mean_given?: number }>;
  goal_url?: string;
  plan_url?: string;
  plugins: Plugin[];
}

export type Source = "live" | "fallback";

async function getJson(url: string, init?: RequestInit): Promise<Results> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as Results;
  if (!data || !Array.isArray(data.plugins) || !data.rounds) throw new Error("Unexpected file shape");
  return data;
}

/** Fetch the live results file; fall back to the copy shipped with the build. */
export async function loadResults(): Promise<{ data: Results; source: Source }> {
  try {
    const data = await getJson(LIVE_URL, { cache: "no-cache" });
    return { data, source: "live" };
  } catch {
    const data = await getJson(FALLBACK_URL);
    return { data, source: "fallback" };
  }
}

export const slug = (p: Plugin) => `${p.pr}-${p.name}`;
export const hashFor = (p: Plugin) => `#/p/${encodeURIComponent(slug(p))}`;

/** Reads made inside real Hermes in round 3. */
export const insideReads = (p: Plugin) => (p.reads ?? []).filter((r) => r.round === 3);

export function reachLabel(p: Plugin): string {
  switch (p.stage) {
    case "final":
      return "Finalist";
    case "round3": {
      const n = insideReads(p).length;
      return n > 0 ? `Run inside Hermes by ${n} agent${n === 1 ? "" : "s"}` : "Run inside Hermes";
    }
    case "read2":
      return "Read twice";
    case "read1":
      return "Read once";
    default:
      return "Could not be read";
  }
}

export const STAGE_DEPTH: Record<Stage, number> = { final: 4, round3: 3, read2: 2, read1: 1, unread: 0 };

/** Place order: finalists by final place, then everyone else by score standing, unread last. */
export function placeKey(p: Plugin): number {
  if (p.final?.place != null) return p.final.place;
  if (p.standing != null) return 1000 + p.standing;
  return 100000 + p.pr / 1e7;
}

export const whyList = (f?: Final | null): string[] =>
  !f?.why ? [] : Array.isArray(f.why) ? f.why.filter(Boolean) : [f.why];

export const fmtInt = (n: number) => n.toLocaleString("en-US");
export const fmtScore = (n: number | null | undefined) => (n == null ? "Not scored" : n.toFixed(2));

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function repoAtCommit(p: Plugin): string | null {
  if (!p.repo) return null;
  if (!p.sha) return p.repo;
  return `${p.repo.replace(/\/$/, "")}/tree/${p.sha}${p.folder ? `/${p.folder}` : ""}`;
}

export const CRITERIA = ["useful", "reliable", "polish", "creative", "beyond"] as const;
export type Criterion = (typeof CRITERIA)[number];
export const CRITERION_LABEL: Record<Criterion, string> = {
  useful: "Useful",
  reliable: "Reliable",
  polish: "Polish",
  creative: "Creative",
  beyond: "Beyond",
};

/** Scored reads: not blocked and with a total. */
export const scoredReads = (p: Plugin) => (p.reads ?? []).filter((r) => !r.blocked && r.total != null);

export function averages(p: Plugin): Record<Criterion, number> | null {
  const reads = scoredReads(p);
  if (reads.length === 0) return null;
  const out = {} as Record<Criterion, number>;
  for (const c of CRITERIA) out[c] = reads.reduce((a, r) => a + (Number(r[c]) || 0), 0) / reads.length;
  return out;
}

export function family(judge: string): string {
  const j = judge.toLowerCase();
  if (j.includes("claude")) return "Claude";
  if (j.includes("codex") || j.includes("gpt")) return "Codex";
  return judge;
}

export function roundName(r: Read): string {
  if (r.round === 3) return "Run inside Hermes";
  if (r.round === 2) return "Second read";
  return "First read";
}

export function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/** Median count of inside-Hermes reads per round 3 plugin, so the copy never types it in. */
export function agentsPerInsideRun(plugins: Plugin[]): number {
  const counts = plugins
    .filter((p) => p.round3)
    .map((p) => insideReads(p).length)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  if (!counts.length) return 0;
  return counts[Math.floor(counts.length / 2)];
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export const inWords = (n: number) => WORDS[n] ?? fmtInt(n);
