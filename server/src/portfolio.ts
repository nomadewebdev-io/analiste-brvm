import type {
  Database,
  Position,
  PortfolioState,
  Summary,
  TimePoint,
  Transaction,
} from "./types.js";

/**
 * Tri stable des transactions par date croissante.
 * En cas d'égalité de date, on conserve l'ordre de saisie.
 */
export function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.date < b.item.date) return -1;
      if (a.item.date > b.item.date) return 1;
      return a.index - b.index;
    })
    .map((x) => x.item);
}

interface Lot {
  ticker: string;
  name: string;
  qty: number;
  cost: number; // coût de revient total des titres encore détenus
  realized: number; // plus-value réalisée cumulée
  dividends: number; // dividendes encaissés cumulés
}

/**
 * Rejoue les transactions par ordre de date et calcule, par ticker,
 * la quantité, le coût de revient (coût moyen pondéré),
 * la plus-value réalisée et les dividendes.
 */
export function computeLots(transactions: Transaction[]): Map<string, Lot> {
  const lots = new Map<string, Lot>();

  const ensure = (t: Transaction): Lot => {
    let lot = lots.get(t.ticker);
    if (!lot) {
      lot = {
        ticker: t.ticker,
        name: t.name || t.ticker,
        qty: 0,
        cost: 0,
        realized: 0,
        dividends: 0,
      };
      lots.set(t.ticker, lot);
    }
    // garder le nom le plus récent connu
    if (t.name) lot.name = t.name;
    return lot;
  };

  for (const t of sortByDate(transactions)) {
    const lot = ensure(t);

    if (t.type === "buy") {
      const buyCost = t.qty * t.price + (t.fees || 0);
      lot.qty += t.qty;
      lot.cost += buyCost;
    } else if (t.type === "sell") {
      const qtySold = Math.min(t.qty, lot.qty); // garde-fou anti sur-vente
      const avgCost = lot.qty > 0 ? lot.cost / lot.qty : 0;
      const costOfSold = avgCost * qtySold;
      const proceeds = qtySold * t.price - (t.fees || 0);
      lot.realized += proceeds - costOfSold;
      lot.qty -= qtySold;
      lot.cost -= costOfSold;
      // nettoyage des résidus de flottants quand la ligne est soldée
      if (lot.qty <= 1e-9) {
        lot.qty = 0;
        lot.cost = 0;
      }
    } else if (t.type === "div") {
      lot.dividends += t.amount || 0;
    }
  }

  return lots;
}

/**
 * Construit les positions affichables à partir des lots et des cours saisis.
 */
export function computePositions(db: Database): Position[] {
  const lots = computeLots(db.transactions);
  const positions: Position[] = [];

  // valeur de marché totale (uniquement lignes encore détenues)
  let totalMarketValue = 0;
  const tmp: Array<{ lot: Lot; currentPrice: number; marketValue: number }> = [];

  for (const lot of lots.values()) {
    if (lot.qty <= 0) {
      // ligne soldée: on la garde seulement si elle a réalisé / dividendes
      if (lot.realized === 0 && lot.dividends === 0) continue;
    }
    const currentPrice = db.prices[lot.ticker] ?? 0;
    const marketValue = lot.qty * currentPrice;
    totalMarketValue += marketValue;
    tmp.push({ lot, currentPrice, marketValue });
  }

  for (const { lot, currentPrice, marketValue } of tmp) {
    const avgCost = lot.qty > 0 ? lot.cost / lot.qty : 0;
    const unrealizedPnL = marketValue - lot.cost;
    const unrealizedPct = lot.cost > 0 ? (unrealizedPnL / lot.cost) * 100 : 0;
    const weight = totalMarketValue > 0 ? (marketValue / totalMarketValue) * 100 : 0;
    const target = db.targets[lot.ticker] ?? 0;

    positions.push({
      ticker: lot.ticker,
      name: lot.name,
      qty: lot.qty,
      avgCost,
      invested: lot.cost,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPct,
      realizedPnL: lot.realized,
      dividends: lot.dividends,
      weight,
      target,
      drift: weight - target,
    });
  }

  // tri par valeur de marché décroissante, lignes soldées en bas
  positions.sort((a, b) => b.marketValue - a.marketValue);
  return positions;
}

export function computeSummary(db: Database, positions: Position[]): Summary {
  const marketValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const invested = positions.reduce((s, p) => s + p.invested, 0);
  const dividendsTotal = positions.reduce((s, p) => s + p.dividends, 0);
  const realizedPnLTotal = positions.reduce((s, p) => s + p.realizedPnL, 0);
  const depositsTotal = db.deposits.reduce((s, d) => s + d.amount, 0);
  const unrealizedPnL = marketValue - invested;
  const unrealizedPct = invested > 0 ? (unrealizedPnL / invested) * 100 : 0;

  // Estimation de la trésorerie disponible:
  //   dépôts + dividendes + produit net des ventes - coût net des achats détenus
  // (indicatif: suppose que les achats sont financés par les dépôts)
  let netBuys = 0;
  let netSellProceeds = 0;
  for (const t of db.transactions) {
    if (t.type === "buy") netBuys += t.qty * t.price + (t.fees || 0);
    else if (t.type === "sell") netSellProceeds += t.qty * t.price - (t.fees || 0);
  }
  const cash = depositsTotal + dividendsTotal + netSellProceeds - netBuys;

  return {
    marketValue,
    invested,
    unrealizedPnL,
    unrealizedPct,
    dividendsTotal,
    realizedPnLTotal,
    depositsTotal,
    cash,
  };
}

/**
 * Série temporelle: capital cumulé déposé vs coût investi cumulé (net des ventes
 * au coût moyen). La valorisation historique réelle n'est pas calculable sans
 * historique de cours; le frontend ajoute le point de valorisation actuelle.
 */
export function computeTimeseries(db: Database): TimePoint[] {
  type Event = { date: string; deposit: number; investedDelta: number };
  const events: Event[] = [];

  for (const d of db.deposits) {
    events.push({ date: d.date, deposit: d.amount, investedDelta: 0 });
  }

  // pour le coût investi, on rejoue les transactions avec coût moyen
  const lots = new Map<string, { qty: number; cost: number }>();
  for (const t of sortByDate(db.transactions)) {
    let lot = lots.get(t.ticker);
    if (!lot) {
      lot = { qty: 0, cost: 0 };
      lots.set(t.ticker, lot);
    }
    if (t.type === "buy") {
      const c = t.qty * t.price + (t.fees || 0);
      lot.qty += t.qty;
      lot.cost += c;
      events.push({ date: t.date, deposit: 0, investedDelta: c });
    } else if (t.type === "sell") {
      const qtySold = Math.min(t.qty, lot.qty);
      const avg = lot.qty > 0 ? lot.cost / lot.qty : 0;
      const costOfSold = avg * qtySold;
      lot.qty -= qtySold;
      lot.cost -= costOfSold;
      events.push({ date: t.date, deposit: 0, investedDelta: -costOfSold });
    }
  }

  const sorted = sortByDate(events);
  const points: TimePoint[] = [];
  let deposited = 0;
  let invested = 0;
  for (const e of sorted) {
    deposited += e.deposit;
    invested += e.investedDelta;
    const last = points[points.length - 1];
    if (last && last.date === e.date) {
      last.deposited = deposited;
      last.invested = invested;
    } else {
      points.push({ date: e.date, deposited, invested });
    }
  }
  return points;
}

export function buildState(db: Database): PortfolioState {
  const positions = computePositions(db);
  const summary = computeSummary(db, positions);
  const timeseries = computeTimeseries(db);
  return {
    positions,
    summary,
    timeseries,
    transactions: sortByDate(db.transactions).reverse(), // plus récentes d'abord
    deposits: sortByDate(db.deposits).reverse(),
    prices: db.prices,
    targets: db.targets,
  };
}
