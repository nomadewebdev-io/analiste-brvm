// Types miroir du backend (gardés synchronisés manuellement).

export type TxType = "buy" | "sell" | "div";

export interface Transaction {
  id: string;
  date: string;
  type: TxType;
  ticker: string;
  name: string;
  qty: number;
  price: number;
  fees: number;
  amount: number;
  note?: string;
}

export interface Deposit {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Position {
  ticker: string;
  name: string;
  qty: number;
  avgCost: number;
  invested: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPct: number;
  realizedPnL: number;
  dividends: number;
  weight: number;
  target: number;
  drift: number;
}

export interface Summary {
  marketValue: number;
  invested: number;
  unrealizedPnL: number;
  unrealizedPct: number;
  dividendsTotal: number;
  realizedPnLTotal: number;
  depositsTotal: number;
  cash: number;
}

export interface TimePoint {
  date: string;
  deposited: number;
  invested: number;
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

export interface TickerRef {
  ticker: string;
  name: string;
  sector: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
