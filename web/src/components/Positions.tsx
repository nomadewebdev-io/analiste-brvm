import { useState } from "react";
import type { PortfolioState } from "../types.ts";
import { fcfa, pct, pnlColor } from "../format.ts";
import { api } from "../api.ts";
import { Card, SectionTitle } from "./ui.tsx";

/** Barre de poids avec repère de la cible. */
function WeightBar({ weight, target }: { weight: number; target: number }) {
  const w = Math.min(100, Math.max(0, weight));
  const t = Math.min(100, Math.max(0, target));
  const over = target > 0 && weight > target + 5; // déborde nettement la cible
  return (
    <div className="relative h-2.5 w-28 rounded-full bg-forest-100">
      <div
        className={`h-2.5 rounded-full ${over ? "bg-loss" : "bg-forest-500"}`}
        style={{ width: `${w}%` }}
      />
      {target > 0 && (
        <div
          className="absolute top-[-2px] h-[14px] w-[2px] bg-gold-500"
          style={{ left: `${t}%` }}
          title={`Cible ${target}%`}
        />
      )}
    </div>
  );
}

export function Positions({
  state,
  onState,
}: {
  state: PortfolioState;
  onState: (s: PortfolioState) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function savePrice(ticker: string) {
    const v = Number(draft.replace(/\s/g, "").replace(",", "."));
    if (!Number.isNaN(v)) {
      const s = await api.setPrice(ticker, v);
      onState(s);
    }
    setEditing(null);
  }

  return (
    <Card className="p-5">
      <SectionTitle
        title="Positions"
        subtitle="Cours saisi manuellement (pas de flux automatique BRVM). Clique sur un cours pour le modifier."
      />
      {state.positions.length === 0 ? (
        <p className="py-8 text-center text-sm text-forest-400">
          Aucune position. Saisis un achat dans l'onglet « Saisie ».
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-left text-xs uppercase tracking-wide text-forest-500">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Valeur</th>
                <th className="py-2 pr-3 text-right">Titres</th>
                <th className="py-2 pr-3 text-right">PRU</th>
                <th className="py-2 pr-3 text-right">Cours</th>
                <th className="py-2 pr-3 text-right">Valorisation</th>
                <th className="py-2 pr-3 text-right">+/- value</th>
                <th className="py-2 pr-3 text-right">Dividendes</th>
                <th className="py-2 pr-3">Poids / cible</th>
              </tr>
            </thead>
            <tbody>
              {state.positions.map((p) => (
                <tr key={p.ticker} className="border-b border-forest-50 hover:bg-forest-50/50">
                  <td className="py-2.5 pr-3 font-semibold text-forest-800">{p.ticker}</td>
                  <td className="py-2.5 pr-3 text-forest-600">{p.name}</td>
                  <td className="num py-2.5 pr-3 text-right">{p.qty}</td>
                  <td className="num py-2.5 pr-3 text-right">{fcfa(p.avgCost)}</td>
                  <td className="num py-2.5 pr-3 text-right">
                    {editing === p.ticker ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => savePrice(p.ticker)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePrice(p.ticker);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="num w-24 rounded border border-forest-300 px-1 py-0.5 text-right"
                      />
                    ) : (
                      <button
                        className="rounded px-1 underline decoration-dotted underline-offset-4 hover:bg-forest-100"
                        onClick={() => {
                          setEditing(p.ticker);
                          setDraft(String(p.currentPrice));
                        }}
                      >
                        {fcfa(p.currentPrice)}
                      </button>
                    )}
                  </td>
                  <td className="num py-2.5 pr-3 text-right">{fcfa(p.marketValue)}</td>
                  <td className={`num py-2.5 pr-3 text-right ${pnlColor(p.unrealizedPnL)}`}>
                    {pct(p.unrealizedPct)}
                  </td>
                  <td className="num py-2.5 pr-3 text-right text-gold-600">{fcfa(p.dividends)}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <WeightBar weight={p.weight} target={p.target} />
                      <span className="num text-xs text-forest-600">{p.weight.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
