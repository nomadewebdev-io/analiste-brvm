import { useMemo, useState } from "react";
import type { PortfolioState, TickerRef, TxType } from "../types.ts";
import { fcfa, todayISO } from "../format.ts";
import { api } from "../api.ts";
import { Button, Card, Field, Input, SectionTitle } from "./ui.tsx";

export function TransactionForm({
  state,
  tickers,
  onState,
}: {
  state: PortfolioState;
  tickers: TickerRef[];
  onState: (s: PortfolioState) => void;
}) {
  const [type, setType] = useState<TxType>("buy");
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const suggestions = useMemo(() => {
    const q = ticker.trim().toUpperCase();
    if (!q) return [];
    return tickers
      .filter((t) => t.ticker.includes(q) || t.name.toUpperCase().includes(q))
      .slice(0, 6);
  }, [ticker, tickers]);

  function pick(t: TickerRef) {
    setTicker(t.ticker);
    setName(t.name);
  }

  function onTickerChange(v: string) {
    setTicker(v);
    const match = tickers.find((t) => t.ticker === v.trim().toUpperCase());
    if (match) setName(match.name);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ticker.trim()) return setError("Le code (ticker) est requis.");
    setBusy(true);
    try {
      const s = await api.addTransaction({
        type,
        ticker: ticker.trim().toUpperCase(),
        name: name.trim() || ticker.trim().toUpperCase(),
        date,
        qty: Number(qty) || 0,
        price: Number(price) || 0,
        fees: Number(fees) || 0,
        amount: Number(amount) || 0,
        note: note.trim() || undefined,
      });
      onState(s);
      // reset partiel
      setQty("");
      setPrice("");
      setFees("");
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const isDiv = type === "div";

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionTitle
          title="Saisie d'une opération"
          subtitle="Enregistre un achat, une vente ou un dividende. Tu exécutes tes ordres via ta SGI, puis tu les saisis ici pour le suivi."
        />
        <form onSubmit={submit} className="space-y-4">
          {/* sélecteur de type */}
          <div className="inline-flex rounded-lg border border-forest-200 p-1">
            {([
              ["buy", "Achat"],
              ["sell", "Vente"],
              ["div", "Dividende"],
            ] as [TxType, string][]).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setType(val)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  type === val ? "bg-forest-700 text-white" : "text-forest-600 hover:bg-forest-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Field label="Code (ticker)">
                <Input
                  value={ticker}
                  onChange={(e) => onTickerChange(e.target.value)}
                  placeholder="SNTS"
                  autoComplete="off"
                />
              </Field>
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-forest-200 bg-white shadow-lg">
                  {suggestions.map((t) => (
                    <li key={t.ticker}>
                      <button
                        type="button"
                        onClick={() => pick(t)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-forest-50"
                      >
                        <span className="font-semibold text-forest-800">{t.ticker}</span>
                        <span className="truncate pl-2 text-forest-500">{t.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Field label="Nom de la valeur">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sonatel" />
            </Field>

            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            {!isDiv && (
              <>
                <Field label="Quantité (titres)">
                  <Input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} className="num" />
                </Field>
                <Field label="Cours unitaire (FCFA)">
                  <Input type="number" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="num" />
                </Field>
                <Field label="Frais (FCFA)">
                  <Input type="number" min="0" step="any" value={fees} onChange={(e) => setFees(e.target.value)} className="num" />
                </Field>
              </>
            )}

            {isDiv && (
              <Field label="Montant reçu (FCFA)">
                <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />
              </Field>
            )}

            <Field label="Note (optionnel)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex. dividende 2024" />
            </Field>
          </div>

          {!isDiv && qty && price && (
            <p className="num text-sm text-forest-600">
              Montant {type === "buy" ? "investi" : "encaissé"} estimé :{" "}
              <strong>
                {fcfa(
                  Number(qty) * Number(price) + (type === "buy" ? 1 : -1) * (Number(fees) || 0)
                )}{" "}
                F
              </strong>
            </p>
          )}

          {error && <p className="text-sm text-loss">{error}</p>}

          <Button type="submit" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer l'opération"}
          </Button>
        </form>
      </Card>

      {/* Journal des opérations */}
      <Card className="p-5">
        <SectionTitle title="Journal des opérations" subtitle="Les plus récentes en premier." />
        {state.transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-forest-400">Aucune opération enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forest-100 text-left text-xs uppercase tracking-wide text-forest-500">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3 text-right">Qté</th>
                  <th className="py-2 pr-3 text-right">Cours/Montant</th>
                  <th className="py-2 pr-3 text-right">Frais</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {state.transactions.map((t) => (
                  <tr key={t.id} className="border-b border-forest-50">
                    <td className="num py-2 pr-3">{t.date}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          t.type === "buy"
                            ? "bg-forest-100 text-forest-700"
                            : t.type === "sell"
                            ? "bg-loss/10 text-loss"
                            : "bg-gold-400/20 text-gold-600"
                        }`}
                      >
                        {t.type === "buy" ? "Achat" : t.type === "sell" ? "Vente" : "Dividende"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-medium text-forest-800">{t.ticker}</td>
                    <td className="num py-2 pr-3 text-right">{t.type === "div" ? "—" : t.qty}</td>
                    <td className="num py-2 pr-3 text-right">
                      {t.type === "div" ? fcfa(t.amount) : fcfa(t.price)}
                    </td>
                    <td className="num py-2 pr-3 text-right">{t.type === "div" ? "—" : fcfa(t.fees)}</td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        onClick={async () => onState(await api.deleteTransaction(t.id))}
                        className="text-xs text-loss hover:underline"
                        aria-label="Supprimer"
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
    </div>
  );
}
