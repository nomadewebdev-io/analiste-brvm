import { useState } from "react";
import type { PortfolioState } from "../types.ts";
import { pct } from "../format.ts";
import { api } from "../api.ts";
import { Card, Input, SectionTitle } from "./ui.tsx";

export function Targets({
  state,
  onState,
}: {
  state: PortfolioState;
  onState: (s: PortfolioState) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // tickers à afficher: positions ouvertes + tickers ayant déjà une cible
  const tickers = Array.from(
    new Set([...state.positions.map((p) => p.ticker), ...Object.keys(state.targets)])
  );

  const totalTarget = Object.values(state.targets).reduce((s, v) => s + v, 0);

  async function save(ticker: string) {
    const raw = drafts[ticker];
    if (raw === undefined) return;
    const v = Number(raw.replace(",", "."));
    if (!Number.isNaN(v)) onState(await api.setTarget(ticker, v));
  }

  return (
    <Card className="p-5">
      <SectionTitle
        title="Répartition cible"
        subtitle="Définis un % cible par valeur. L'écart réel/cible et les lignes qui débordent sont signalés."
        right={
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-forest-500">Somme des cibles</div>
            <div
              className={`num text-xl font-semibold ${
                Math.abs(totalTarget - 100) < 0.5 ? "text-gain" : "text-loss"
              }`}
            >
              {totalTarget.toFixed(0)}%
            </div>
          </div>
        }
      />

      {Math.abs(totalTarget - 100) >= 0.5 && totalTarget > 0 && (
        <p className="mb-4 rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          La somme des cibles est de {totalTarget.toFixed(0)}% (idéalement 100%).
        </p>
      )}

      {tickers.length === 0 ? (
        <p className="py-6 text-center text-sm text-forest-400">
          Aucune valeur. Ajoute des positions d'abord.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-left text-xs uppercase tracking-wide text-forest-500">
                <th className="py-2 pr-3">Valeur</th>
                <th className="py-2 pr-3 text-right">Poids réel</th>
                <th className="py-2 pr-3 text-right">Cible</th>
                <th className="py-2 pr-3 text-right">Écart</th>
                <th className="py-2 pr-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {tickers.map((tk) => {
                const pos = state.positions.find((p) => p.ticker === tk);
                const weight = pos?.weight ?? 0;
                const target = state.targets[tk] ?? 0;
                const drift = weight - target;
                const over = target > 0 && drift > 5;
                const under = target > 0 && drift < -5;
                return (
                  <tr key={tk} className="border-b border-forest-50">
                    <td className="py-2.5 pr-3 font-medium text-forest-800">
                      {tk} <span className="font-normal text-forest-500">{pos?.name ?? ""}</span>
                    </td>
                    <td className="num py-2.5 pr-3 text-right">{weight.toFixed(1)}%</td>
                    <td className="py-2.5 pr-3 text-right">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        defaultValue={target || ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [tk]: e.target.value }))}
                        onBlur={() => save(tk)}
                        onKeyDown={(e) => e.key === "Enter" && save(tk)}
                        className="num w-20 text-right"
                      />
                    </td>
                    <td
                      className={`num py-2.5 pr-3 text-right ${
                        target === 0 ? "text-forest-400" : drift >= 0 ? "text-gain" : "text-loss"
                      }`}
                    >
                      {target === 0 ? "—" : pct(drift)}
                    </td>
                    <td className="py-2.5 pr-3">
                      {target === 0 ? (
                        <span className="text-xs text-forest-400">pas de cible</span>
                      ) : over ? (
                        <span className="rounded bg-loss/10 px-2 py-0.5 text-xs text-loss">Déborde</span>
                      ) : under ? (
                        <span className="rounded bg-gold-400/20 px-2 py-0.5 text-xs text-gold-600">
                          Sous-pondéré
                        </span>
                      ) : (
                        <span className="rounded bg-forest-100 px-2 py-0.5 text-xs text-forest-700">
                          Aligné
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
