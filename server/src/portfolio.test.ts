import { describe, expect, it } from "vitest";
import { computeLots, computePositions, computeSummary } from "./portfolio.js";
import type { Database, Transaction } from "./types.js";

const buy = (ticker: string, date: string, qty: number, price: number, fees = 0): Transaction => ({
  id: `${ticker}-${date}-b`, date, type: "buy", ticker, name: ticker, qty, price, fees, amount: 0,
});
const sell = (ticker: string, date: string, qty: number, price: number, fees = 0): Transaction => ({
  id: `${ticker}-${date}-s`, date, type: "sell", ticker, name: ticker, qty, price, fees, amount: 0,
});
const div = (ticker: string, date: string, amount: number): Transaction => ({
  id: `${ticker}-${date}-d`, date, type: "div", ticker, name: ticker, qty: 0, price: 0, fees: 0, amount,
});

describe("coût moyen pondéré", () => {
  it("calcule le PRU avec frais intégrés", () => {
    // 2 @ 1000 + 100 frais = 2100 ; 1 @ 1300 + 50 frais = 1350 ; total 3450 / 3 = 1150
    const lots = computeLots([buy("X", "2025-01-01", 2, 1000, 100), buy("X", "2025-02-01", 1, 1300, 50)]);
    const lot = lots.get("X")!;
    expect(lot.qty).toBe(3);
    expect(lot.cost).toBe(3450);
    expect(lot.cost / lot.qty).toBeCloseTo(1150, 6);
  });

  it("rejoue les transactions par date même si saisies dans le désordre", () => {
    const lots = computeLots([buy("X", "2025-02-01", 1, 1300), buy("X", "2025-01-01", 2, 1000)]);
    const lot = lots.get("X")!;
    expect(lot.qty).toBe(3);
    expect(lot.cost).toBe(3300);
  });
});

describe("plus-value réalisée sur vente (coût moyen)", () => {
  it("calcule la +value et conserve le PRU sur le reliquat", () => {
    // achat 10 @ 1000 (frais 0) -> PRU 1000
    // vente 4 @ 1500 (frais 0) -> produit 6000, coût sortant 4000 -> +value 2000
    const lots = computeLots([buy("X", "2025-01-01", 10, 1000), sell("X", "2025-03-01", 4, 1500)]);
    const lot = lots.get("X")!;
    expect(lot.realized).toBe(2000);
    expect(lot.qty).toBe(6);
    expect(lot.cost).toBe(6000); // 6 titres restants au PRU 1000
    expect(lot.cost / lot.qty).toBe(1000);
  });

  it("intègre les frais de vente dans la +value réalisée", () => {
    // produit net = 4*1500 - 200 = 5800 ; coût sortant 4000 -> +value 1800
    const lots = computeLots([buy("X", "2025-01-01", 10, 1000), sell("X", "2025-03-01", 4, 1500, 200)]);
    expect(lots.get("X")!.realized).toBe(1800);
  });

  it("solde la ligne à zéro quand tout est vendu", () => {
    const lots = computeLots([buy("X", "2025-01-01", 5, 1000), sell("X", "2025-03-01", 5, 1200)]);
    const lot = lots.get("X")!;
    expect(lot.qty).toBe(0);
    expect(lot.cost).toBe(0);
    expect(lot.realized).toBe(1000); // (1200-1000)*5
  });

  it("borne la quantité vendue à la quantité détenue (anti sur-vente)", () => {
    const lots = computeLots([buy("X", "2025-01-01", 3, 1000), sell("X", "2025-03-01", 10, 1500)]);
    const lot = lots.get("X")!;
    expect(lot.qty).toBe(0);
    expect(lot.realized).toBe(1500); // ne vend que 3 titres: (1500-1000)*3
  });
});

describe("dividendes", () => {
  it("cumule les dividendes par ligne", () => {
    const lots = computeLots([buy("X", "2025-01-01", 1, 1000), div("X", "2025-06-01", 350), div("X", "2025-12-01", 400)]);
    expect(lots.get("X")!.dividends).toBe(750);
  });
});

describe("positions et résumé", () => {
  const db: Database = {
    transactions: [buy("X", "2025-01-01", 10, 1000), sell("X", "2025-03-01", 4, 1500), div("X", "2025-06-01", 500)],
    prices: { X: 1200 },
    targets: { X: 100 },
    deposits: [{ id: "d", date: "2025-01-01", amount: 20000 }],
  };

  it("calcule valorisation, +value latente et poids", () => {
    const positions = computePositions(db);
    const p = positions.find((x) => x.ticker === "X")!;
    expect(p.qty).toBe(6);
    expect(p.avgCost).toBe(1000);
    expect(p.marketValue).toBe(7200); // 6 * 1200
    expect(p.unrealizedPnL).toBe(1200); // 7200 - 6000
    expect(p.unrealizedPct).toBeCloseTo(20, 6);
    expect(p.realizedPnL).toBe(2000);
    expect(p.dividends).toBe(500);
    expect(p.weight).toBeCloseTo(100, 6);
  });

  it("agrège correctement le résumé global", () => {
    const positions = computePositions(db);
    const s = computeSummary(db, positions);
    expect(s.marketValue).toBe(7200);
    expect(s.invested).toBe(6000);
    expect(s.unrealizedPnL).toBe(1200);
    expect(s.dividendsTotal).toBe(500);
    expect(s.realizedPnLTotal).toBe(2000);
    expect(s.depositsTotal).toBe(20000);
  });
});
