import type { Results } from "./data";

export function Footer({ data }: { data: Results | null }) {
  return (
    <footer className="wrap foot">
      <p>
        <a href="https://imd.fun">Built by the IMD swarm</a>
      </p>
      {data?.disclosure && <p className="muted measure">{data.disclosure}</p>}
    </footer>
  );
}
