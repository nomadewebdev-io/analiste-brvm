import type { TimePoint } from "../types.ts";
import { fcfa } from "../format.ts";

/**
 * Graphique SVG léger (sans dépendance): capital cumulé déposé vs coût investi
 * cumulé dans le temps. Un repère final indique la valorisation actuelle.
 * NB: la valorisation historique réelle n'est pas calculable sans historique de
 * cours; seule la valeur actuelle (aujourd'hui) est tracée comme repère.
 */
export function ProgressChart({
  timeseries,
  currentValue,
}: {
  timeseries: TimePoint[];
  currentValue: number;
}) {
  if (timeseries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-forest-200 text-sm text-forest-400">
        Aucune donnée à afficher — saisis des versements et des achats.
      </div>
    );
  }

  const W = 720;
  const H = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 64 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const dates = timeseries.map((p) => new Date(p.date).getTime());
  const minT = Math.min(...dates);
  const maxT = Math.max(...dates, Date.now());
  const tSpan = Math.max(1, maxT - minT);

  const maxY = Math.max(
    1,
    ...timeseries.map((p) => p.deposited),
    ...timeseries.map((p) => p.invested),
    currentValue
  );

  const x = (t: number) => pad.left + ((t - minT) / tSpan) * innerW;
  const y = (v: number) => pad.top + innerH - (v / maxY) * innerH;

  const line = (key: "deposited" | "invested") =>
    timeseries.map((p, i) => `${i === 0 ? "M" : "L"} ${x(new Date(p.date).getTime())} ${y(p[key])}`).join(" ");

  const lastT = Math.max(...dates);
  const todayX = x(Math.max(lastT, Date.now()));

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label="Progression des versements">
        {/* grille horizontale */}
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="#dce9e1" strokeWidth={1} />
            <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize={10} fill="#5f9079" className="num">
              {fcfa(v)}
            </text>
          </g>
        ))}

        {/* coût investi cumulé */}
        <path d={line("invested")} fill="none" stroke="#27483b" strokeWidth={2} />
        {/* capital déposé cumulé */}
        <path d={line("deposited")} fill="none" stroke="#c79a3e" strokeWidth={2} strokeDasharray="5 4" />

        {/* repère valorisation actuelle */}
        <circle cx={todayX} cy={y(currentValue)} r={4} fill="#2f8f5b" />
        <text x={todayX - 6} y={y(currentValue) - 8} textAnchor="end" fontSize={10} fill="#2f8f5b" className="num">
          {fcfa(currentValue)} F
        </text>

        {/* légende */}
        <g transform={`translate(${pad.left}, ${H - 6})`}>
          <rect x={0} y={-8} width={14} height={3} fill="#c79a3e" />
          <text x={20} y={-4} fontSize={10} fill="#27483b">Déposé</text>
          <rect x={90} y={-8} width={14} height={3} fill="#27483b" />
          <text x={110} y={-4} fontSize={10} fill="#27483b">Investi (coût)</text>
          <circle cx={210} cy={-6} r={4} fill="#2f8f5b" />
          <text x={220} y={-4} fontSize={10} fill="#27483b">Valeur actuelle</text>
        </g>
      </svg>
    </div>
  );
}
