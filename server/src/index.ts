import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { load, reset, update } from "./db.js";
import { buildState } from "./portfolio.js";
import { BRVM_TICKERS } from "./tickers.js";
import { callAnalyst } from "./ai.js";
import type { Deposit, Transaction, TxType } from "./types.js";

// Charge server/.env
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, "..", ".env") });

const PORT = Number(process.env.PORT || 8787);

const app = express();
// Restreint les requêtes cross-origin au frontend local uniquement
app.use(cors({ origin: [`http://localhost:5173`, `http://localhost:${PORT}`] }));
app.use(express.json({ limit: "1mb" }));
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ── Statut de la clé IA (permet au frontend d'afficher un avertissement) ──
app.get("/api/ai-status", (_req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  const configured = Boolean(key && !key.startsWith("sk-ant-xxxx"));
  res.json({ configured });
});

// ── État complet (positions calculées + résumé + séries) ────────
app.get("/api/state", (_req, res) => {
  res.json(buildState(load()));
});

// ── Référentiel de tickers BRVM ─────────────────────────────────
app.get("/api/tickers", (_req, res) => {
  res.json(BRVM_TICKERS);
});

// ── Transactions ────────────────────────────────────────────────
app.post("/api/transactions", (req, res) => {
  const b = req.body ?? {};
  const type = b.type as TxType;
  if (!["buy", "sell", "div"].includes(type)) {
    return res.status(400).json({ error: "type invalide (buy|sell|div)" });
  }
  if (!b.ticker || typeof b.ticker !== "string") {
    return res.status(400).json({ error: "ticker requis" });
  }
  if (!b.date) return res.status(400).json({ error: "date requise" });

  const tx: Transaction = {
    id: newId(),
    date: String(b.date),
    type,
    ticker: String(b.ticker).toUpperCase().trim(),
    name: String(b.name || b.ticker).trim(),
    qty: Number(b.qty) || 0,
    price: Number(b.price) || 0,
    fees: Number(b.fees) || 0,
    amount: Number(b.amount) || 0,
    note: b.note ? String(b.note) : undefined,
  };

  update((db) => db.transactions.push(tx));
  res.json(buildState(load()));
});

app.delete("/api/transactions/:id", (req, res) => {
  update((db) => {
    db.transactions = db.transactions.filter((t) => t.id !== req.params.id);
  });
  res.json(buildState(load()));
});

// ── Cours actuels (saisie manuelle) ─────────────────────────────
app.put("/api/prices", (req, res) => {
  const { ticker, price } = req.body ?? {};
  if (!ticker) return res.status(400).json({ error: "ticker requis" });
  update((db) => {
    db.prices[String(ticker).toUpperCase().trim()] = Number(price) || 0;
  });
  res.json(buildState(load()));
});

// ── Répartition cible ───────────────────────────────────────────
app.put("/api/targets", (req, res) => {
  const { ticker, pct } = req.body ?? {};
  if (!ticker) return res.status(400).json({ error: "ticker requis" });
  update((db) => {
    const key = String(ticker).toUpperCase().trim();
    const v = Number(pct);
    if (!v) delete db.targets[key];
    else db.targets[key] = v;
  });
  res.json(buildState(load()));
});

// ── Versements / dépôts ─────────────────────────────────────────
app.post("/api/deposits", (req, res) => {
  const b = req.body ?? {};
  if (!b.date) return res.status(400).json({ error: "date requise" });
  const dep: Deposit = {
    id: newId(),
    date: String(b.date),
    amount: Number(b.amount) || 0,
    note: b.note ? String(b.note) : undefined,
  };
  update((db) => db.deposits.push(dep));
  res.json(buildState(load()));
});

app.delete("/api/deposits/:id", (req, res) => {
  update((db) => {
    db.deposits = db.deposits.filter((d) => d.id !== req.params.id);
  });
  res.json(buildState(load()));
});

// ── Réinitialisation (seed ou vide) ─────────────────────────────
app.post("/api/reset", (req, res) => {
  const withSeed = (req.body?.seed ?? false) === true;
  reset(withSeed);
  res.json(buildState(load()));
});

// ── Proxy analyste IA (la clé reste côté serveur) ───────────────
const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Trop de requêtes — réessaie dans une minute." },
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (messages.length === 0) {
      return res.status(400).json({ error: "messages requis" });
    }
    const state = buildState(load());
    const result = await callAnalyst(state, messages);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur /api/chat:", msg);
    res.status(500).json({ error: msg });
  }
});

// ── Sert le frontend buildé si présent (mode production) ─────────
const webDist = join(__dirname, "..", "..", "web", "dist");
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(webDist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`\n  Analyste BRVM — backend local`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  Clé IA: ${process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-xxxx") ? "configurée ✓" : "NON configurée (chat IA désactivé)"}`);
  console.log(`  Recherche web: ${(process.env.AI_WEB_SEARCH ?? "true") !== "false" ? "activée" : "désactivée"}\n`);
});
