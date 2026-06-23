// Modèle de données partagé du backend.

export type TxType = "buy" | "sell" | "div";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  type: TxType;
  ticker: string;
  name: string;
  qty: number; // pour buy / sell (nombre de titres)
  price: number; // cours unitaire pour buy / sell
  fees: number; // frais de courtage pour buy / sell
  amount: number; // montant reçu pour un dividende (div)
  note?: string;
}

export interface Deposit {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: number; // FCFA déposés
  note?: string;
}

export interface Database {
  transactions: Transaction[];
  prices: Record<string, number>; // ticker -> cours actuel saisi manuellement
  targets: Record<string, number>; // ticker -> % cible (0..100)
  deposits: Deposit[];
}

// ── Structures calculées renvoyées au frontend ──────────────────

export interface Position {
  ticker: string;
  name: string;
  qty: number;
  avgCost: number; // prix de revient moyen par titre
  invested: number; // coût de revient total des titres détenus
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPct: number;
  realizedPnL: number; // plus-value réalisée cumulée sur cette ligne
  dividends: number; // dividendes encaissés cumulés sur cette ligne
  weight: number; // poids réel dans le portefeuille (%)
  target: number; // % cible
  drift: number; // écart réel - cible (points de %)
}

export interface Summary {
  marketValue: number; // valorisation totale
  invested: number; // coût de revient total des positions ouvertes
  unrealizedPnL: number;
  unrealizedPct: number;
  dividendsTotal: number;
  realizedPnLTotal: number;
  depositsTotal: number; // capital total déposé
  cash: number; // estimation de liquidités: dépôts - net investi + dividendes + ventes réalisées
}

export interface TimePoint {
  date: string;
  deposited: number; // capital cumulé déposé
  invested: number; // coût investi cumulé (net des ventes au coût)
}

export interface PortfolioState {
  positions: Position[];
  summary: Summary;
  timeseries: TimePoint[];
  transactions: Transaction[];
  deposits: Deposit[];
  prices: Record<string, number>;
  targets: Record<string, number>;
}
