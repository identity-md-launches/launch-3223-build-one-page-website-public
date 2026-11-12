// Refreshes the fallback copy of results.json shipped with the site.
// The page always fetches the live file first; this copy is used only if that fetch fails.
import { writeFile } from "node:fs/promises";

const URL =
  "https://gist.githubusercontent.com/gtmcknight/594c47336546c8763e641b46cf9af4ec/raw/results.json";
const res = await fetch(URL);
if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
const text = await res.text();
const data = JSON.parse(text);
if (!Array.isArray(data.plugins)) throw new Error("No plugins array in results.json");
await writeFile(new URL("../public/results.json", import.meta.url), text);
console.log(`Saved ${data.plugins.length} plugins, updated ${data.updated}`);
