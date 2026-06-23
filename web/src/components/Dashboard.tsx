import type { PortfolioState } from "../types.ts";
import { fcfa, pct, pnlColor, signedFcfa } from "../format.ts";
import { Card } from "./ui.tsx";
import { ProgressChart } from "./ProgressChart.tsx";

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "gain" | "loss" | "gold";
}) {
  const valueColor = {
    default: "text-forest-800",
    gain: "text-gain",
    loss: "text-loss",
    gold: "text-gold-600",
  }[tone];
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-forest-500">{label}</div>
      <div className={`num mt-1 text-2xl font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className={`num mt-0.5 text-sm ${valueColor}`}>{sub}</div>}
    </Card>
  );
}

export function Dashboard({ state }: { state: PortfolioState }) {
  const s = state.summary;
  const progression = s.depositsTotal > 0 ? ((s.marketValue + s.cash - s.depositsTotal) / s.depositsTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Valorisation totale" value={`${fcfa(s.marketValue)} F`} />
        <Stat label="Montant investi (coût)" value={`${fcfa(s.invested)} F`} />
        <Stat
          label="Plus/moins-value latente"
          value={`${signedFcfa(s.unrealizedPnL)} F`}
          sub={pct(s.unrealizedPct)}
          tone={s.unrealizedPnL >= 0 ? "gain" : "loss"}
        />
        <Stat label="Dividendes encaissés" value={`${fcfa(s.dividendsTotal)} F`} tone="gold" />
        <Stat
          label="Plus-value réalisée (ventes)"
          value={`${signedFcfa(s.realizedPnLTotal)} F`}
          tone={s.realizedPnLTotal >= 0 ? "gain" : "loss"}
        />
        <Stat label="Liquidités estimées" value={`${fcfa(s.cash)} F`} />
      </div>

      {/* Encart Versements */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-forest-800">Versements & progression</h3>
            <p className="text-sm text-forest-500">
              Capital déposé comparé à la valeur actuelle du portefeuille.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-forest-500">Progression nette</div>
            <div className={`num text-xl font-semibold ${pnlColor(progression)}`}>{pct(progression)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-forest-50 p-3">
            <div className="text-xs text-forest-500">Capital total déposé</div>
            <div className="num text-lg font-semibold text-forest-800">{fcfa(s.depositsTotal)} F</div>
          </div>
          <div className="rounded-lg bg-forest-50 p-3">
            <div className="text-xs text-forest-500">Valeur du portefeuille</div>
            <div className="num text-lg font-semibold text-forest-800">{fcfa(s.marketValue)} F</div>
          </div>
          <div className="rounded-lg bg-forest-50 p-3">
            <div className="text-xs text-forest-500">+ Dividendes + réalisé</div>
            <div className="num text-lg font-semibold text-gold-600">
              {fcfa(s.dividendsTotal + s.realizedPnLTotal)} F
            </div>
          </div>
        </div>

        <div className="mt-5">
          <ProgressChart timeseries={state.timeseries} currentValue={s.marketValue} />
        </div>
      </Card>
    </div>
  );
}
