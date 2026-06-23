import { useEffect, useState } from "react";
import type { PortfolioState, TickerRef } from "./types.ts";
import { api } from "./api.ts";
import { Dashboard } from "./components/Dashboard.tsx";
import { Positions } from "./components/Positions.tsx";
import { TransactionForm } from "./components/TransactionForm.tsx";
import { Deposits } from "./components/Deposits.tsx";
import { Targets } from "./components/Targets.tsx";
import { Analyst } from "./components/Analyst.tsx";

type Tab = "dashboard" | "positions" | "saisie" | "versements" | "cibles" | "analyste";

const TABS: [Tab, string][] = [
  ["dashboard", "Tableau de bord"],
  ["positions", "Positions"],
  ["saisie", "Saisie"],
  ["versements", "Versements"],
  ["cibles", "Cibles"],
  ["analyste", "Analyste IA"],
];

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [state, setState] = useState<PortfolioState | null>(null);
  const [tickers, setTickers] = useState<TickerRef[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getState(), api.getTickers()])
      .then(([s, t]) => {
        setState(s);
        setTickers(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"));
  }, []);

  async function handleReset(seed: boolean) {
    const msg = seed
      ? "Remplacer toutes les données par le jeu d'exemple ?"
      : "Effacer toutes les données du portefeuille ? (irréversible)";
    if (!confirm(msg)) return;
    setState(await api.reset(seed));
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-loss/30 bg-white p-6 text-center">
          <p className="font-semibold text-loss">Backend injoignable</p>
          <p className="mt-2 text-sm text-forest-600">{error}</p>
          <p className="mt-3 text-xs text-forest-500">
            Lance le backend avec <code className="rounded bg-forest-50 px-1">npm run dev</code> à la
            racine du projet.
          </p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-forest-500">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* En-tête */}
      <header className="border-b border-forest-100 bg-forest-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Analyste BRVM <span className="text-gold-400">·</span> Portefeuille
            </h1>
            <p className="text-xs text-forest-200">
              Cockpit financier privé — UEMOA · FCFA. Données locales, aucun courtage connecté.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleReset(true)}
              className="rounded-lg border border-forest-600 px-3 py-1.5 text-xs text-forest-100 hover:bg-forest-800"
            >
              Données d'exemple
            </button>
            <button
              onClick={() => handleReset(false)}
              className="rounded-lg border border-forest-600 px-3 py-1.5 text-xs text-forest-100 hover:bg-forest-800"
            >
              Tout effacer
            </button>
          </div>
        </div>

        {/* Onglets */}
        <nav className="mx-auto max-w-6xl px-2">
          <div className="flex flex-wrap gap-1">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                  tab === key
                    ? "bg-parchment text-forest-800"
                    : "text-forest-100 hover:bg-forest-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "dashboard" && <Dashboard state={state} />}
        {tab === "positions" && <Positions state={state} onState={setState} />}
        {tab === "saisie" && <TransactionForm state={state} tickers={tickers} onState={setState} />}
        {tab === "versements" && <Deposits state={state} onState={setState} />}
        {tab === "cibles" && <Targets state={state} onState={setState} />}
        {tab === "analyste" && <Analyst />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-forest-400">
        Application locale mono-utilisateur. Aucune connexion à un broker, aucun ordre passé. Les
        analyses de l'IA ne constituent pas un conseil en investissement agréé.
      </footer>
    </div>
  );
}
