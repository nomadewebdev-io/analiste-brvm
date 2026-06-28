import type { ChatMessage, PortfolioState, TickerRef, TxType } from "./types.ts";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getState: () => req<PortfolioState>("/api/state"),
  getTickers: () => req<TickerRef[]>("/api/tickers"),

  addTransaction: (tx: {
    type: TxType;
    ticker: string;
    name: string;
    date: string;
    qty?: number;
    price?: number;
    fees?: number;
    amount?: number;
    note?: string;
  }) => req<PortfolioState>("/api/transactions", { method: "POST", body: JSON.stringify(tx) }),

  deleteTransaction: (id: string) =>
    req<PortfolioState>(`/api/transactions/${id}`, { method: "DELETE" }),

  setPrice: (ticker: string, price: number) =>
    req<PortfolioState>("/api/prices", { method: "PUT", body: JSON.stringify({ ticker, price }) }),

  setTarget: (ticker: string, pct: number) =>
    req<PortfolioState>("/api/targets", { method: "PUT", body: JSON.stringify({ ticker, pct }) }),

  addDeposit: (d: { date: string; amount: number; note?: string }) =>
    req<PortfolioState>("/api/deposits", { method: "POST", body: JSON.stringify(d) }),

  deleteDeposit: (id: string) =>
    req<PortfolioState>(`/api/deposits/${id}`, { method: "DELETE" }),

  reset: (seed: boolean) =>
    req<PortfolioState>("/api/reset", { method: "POST", body: JSON.stringify({ seed }) }),

  aiStatus: () => req<{ configured: boolean }>("/api/ai-status"),

  chat: (messages: ChatMessage[]) =>
    req<{ text: string; usedWebSearch: boolean }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
};
