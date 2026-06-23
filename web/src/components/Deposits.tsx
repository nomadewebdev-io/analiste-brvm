import { useState } from "react";
import type { PortfolioState } from "../types.ts";
import { fcfa, todayISO } from "../format.ts";
import { api } from "../api.ts";
import { Button, Card, Field, Input, SectionTitle } from "./ui.tsx";

export function Deposits({
  state,
  onState,
}: {
  state: PortfolioState;
  onState: (s: PortfolioState) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("50000");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const s = await api.addDeposit({ date, amount: Number(amount) || 0 });
      onState(s);
      setAmount("50000");
    } finally {
      setBusy(false);
    }
  }

  const total = state.deposits.reduce((s, d) => s + d.amount, 0);

  return (
    <Card className="p-5">
      <SectionTitle
        title="Versements mensuels"
        subtitle="Enregistre chaque dépôt pour suivre ton effort d'épargne dans le temps."
        right={
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-forest-500">Total déposé</div>
            <div className="num text-xl font-semibold text-forest-800">{fcfa(total)} F</div>
          </div>
        }
      />

      <form onSubmit={add} className="mb-5 flex flex-wrap items-end gap-3">
        <Field label="Date du dépôt">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Montant (FCFA)">
          <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />
        </Field>
        <Button type="submit" variant="gold" disabled={busy}>
          {busy ? "…" : "Ajouter le versement"}
        </Button>
      </form>

      {state.deposits.length === 0 ? (
        <p className="py-6 text-center text-sm text-forest-400">Aucun versement enregistré.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-left text-xs uppercase tracking-wide text-forest-500">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3 text-right">Montant</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {state.deposits.map((d) => (
                <tr key={d.id} className="border-b border-forest-50">
                  <td className="num py-2 pr-3">{d.date}</td>
                  <td className="num py-2 pr-3 text-right">{fcfa(d.amount)} F</td>
                  <td className="py-2 pr-3 text-right">
                    <button
                      onClick={async () => onState(await api.deleteDeposit(d.id))}
                      className="text-xs text-loss hover:underline"
                    >
                      Suppr.
                    </button>
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
