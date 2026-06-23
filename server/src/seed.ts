import type { Database } from "./types.js";

/**
 * Jeu de données d'exemple (positions BRVM fictives) pour démarrer avec un
 * tableau de bord rempli. Réinitialisable via le bouton "Réinitialiser".
 */
export function seedDatabase(): Database {
  return {
    transactions: [
      // Sonatel — achats mensuels
      { id: "t1", date: "2025-01-06", type: "buy", ticker: "SNTS", name: "Sonatel", qty: 2, price: 15500, fees: 350, amount: 0 },
      { id: "t2", date: "2025-03-05", type: "buy", ticker: "SNTS", name: "Sonatel", qty: 1, price: 16200, fees: 200, amount: 0 },
      { id: "t3", date: "2025-06-04", type: "div", ticker: "SNTS", name: "Sonatel", qty: 0, price: 0, fees: 0, amount: 4350, note: "Dividende 2024" },

      // Ecobank Côte d'Ivoire
      { id: "t4", date: "2025-02-04", type: "buy", ticker: "ECOC", name: "Ecobank Côte d'Ivoire", qty: 80, price: 230, fees: 300, amount: 0 },
      { id: "t5", date: "2025-05-06", type: "div", ticker: "ECOC", name: "Ecobank Côte d'Ivoire", qty: 0, price: 0, fees: 0, amount: 1200, note: "Dividende 2024" },

      // BOA Sénégal
      { id: "t6", date: "2025-02-04", type: "buy", ticker: "BOAS", name: "Bank of Africa Sénégal", qty: 10, price: 3100, fees: 250, amount: 0 },
      { id: "t7", date: "2025-04-08", type: "buy", ticker: "BOAS", name: "Bank of Africa Sénégal", qty: 5, price: 3250, fees: 150, amount: 0 },

      // TotalEnergies CI — achat puis vente partielle (pour illustrer la +value réalisée)
      { id: "t8", date: "2025-01-06", type: "buy", ticker: "TTLC", name: "TotalEnergies Marketing Côte d'Ivoire", qty: 8, price: 2400, fees: 200, amount: 0 },
      { id: "t9", date: "2025-05-20", type: "sell", ticker: "TTLC", name: "TotalEnergies Marketing Côte d'Ivoire", qty: 3, price: 2750, fees: 180, amount: 0 },
    ],
    prices: {
      SNTS: 16900,
      ECOC: 245,
      BOAS: 3050,
      TTLC: 2700,
    },
    targets: {
      SNTS: 40,
      ECOC: 20,
      BOAS: 25,
      TTLC: 15,
    },
    deposits: [
      { id: "d1", date: "2025-01-02", amount: 50000 },
      { id: "d2", date: "2025-02-03", amount: 50000 },
      { id: "d3", date: "2025-03-03", amount: 50000 },
      { id: "d4", date: "2025-04-02", amount: 50000 },
      { id: "d5", date: "2025-05-02", amount: 50000 },
      { id: "d6", date: "2025-06-02", amount: 50000 },
    ],
  };
}

export function emptyDatabase(): Database {
  return { transactions: [], prices: {}, targets: {}, deposits: [] };
}
