import type { PortfolioState } from "./types.js";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));

/**
 * Construit l'instantané texte du portefeuille injecté dans le system prompt
 * pour que l'analyste raisonne sur les chiffres réels de l'utilisateur.
 */
export function buildPortfolioSnapshot(state: PortfolioState): string {
  const s = state.summary;
  const lines: string[] = [];

  lines.push("INSTANTANÉ DU PORTEFEUILLE (chiffres en FCFA / XOF):");
  lines.push(`- Valorisation totale: ${fmt(s.marketValue)}`);
  lines.push(`- Coût de revient investi: ${fmt(s.invested)}`);
  lines.push(`- Plus/moins-value latente: ${fmt(s.unrealizedPnL)} (${s.unrealizedPct.toFixed(1)}%)`);
  lines.push(`- Dividendes encaissés cumulés: ${fmt(s.dividendsTotal)}`);
  lines.push(`- Plus-value réalisée (ventes): ${fmt(s.realizedPnLTotal)}`);
  lines.push(`- Capital total déposé: ${fmt(s.depositsTotal)}`);
  lines.push("");
  lines.push("POSITIONS:");
  if (state.positions.length === 0) {
    lines.push("- (aucune position ouverte)");
  } else {
    for (const p of state.positions) {
      lines.push(
        `- ${p.ticker} (${p.name}): ${fmt(p.qty)} titres, PRU ${fmt(p.avgCost)}, ` +
          `cours ${fmt(p.currentPrice)}, valeur ${fmt(p.marketValue)}, ` +
          `+/-value ${p.unrealizedPct.toFixed(1)}%, poids ${p.weight.toFixed(1)}%, ` +
          `cible ${p.target.toFixed(0)}% (écart ${p.drift >= 0 ? "+" : ""}${p.drift.toFixed(1)} pts), ` +
          `dividendes ${fmt(p.dividends)}`
      );
    }
  }
  return lines.join("\n");
}

export function buildSystemPrompt(state: PortfolioState): string {
  const snapshot = buildPortfolioSnapshot(state);
  const today = new Date().toISOString().slice(0, 10);

  return `Tu es un analyste financier qui assiste un investisseur particulier sur la BRVM (Bourse Régionale des Valeurs Mobilières de l'UEMOA, cotation en FCFA / XOF). Nous sommes le ${today}.

PROFIL DE L'INVESTISSEUR:
- Investit un montant fixe chaque mois sur le long terme (stratégie de versements réguliers).
- Objectif principal: les dividendes et la constitution patrimoniale, pas le trading court terme.
- Marché: actions de la BRVM (zone UEMOA).

RÈGLES DE SÉCURITÉ ET DE CONDUITE — IMPÉRATIVES:
1. Tu n'es PAS un conseiller en investissement agréé. Tu fournis des analyses et des éléments factuels à but éducatif. Termine toujours par un rappel: « Ceci ne constitue pas un conseil en investissement agréé. »
2. Tu ne passes JAMAIS d'ordre et tu ne te connectes à aucun courtage. Les décisions et les exécutions reviennent entièrement à l'utilisateur via sa SGI.
3. Ne donne pas d'injonctions catégoriques du type « achète maintenant » / « vends maintenant ». Présente les éléments (valorisation, rendement, diversification, risques, calendrier de dividendes) et laisse l'utilisateur décider.
4. Réponds en français, de façon claire et posée. Utilise les CHIFFRES RÉELS du portefeuille ci-dessous. Quand tu cites un montant, exprime-le en FCFA.
5. Quand tu as besoin d'informations à jour (cours récents, dates de détachement de dividendes, résultats), utilise l'outil de recherche web et cite tes sources. Précise que les cours BRVM peuvent être différés.

${snapshot}

Quand l'utilisateur demande une analyse de répartition, compare le poids réel à la cible et signale les écarts importants. Pour les dividendes, mets en avant le calendrier de détachement à surveiller.`;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResult {
  text: string;
  usedWebSearch: boolean;
}

/**
 * Appelle l'API Messages (Anthropic ou proxy compatible) avec l'outil web_search.
 * La clé d'API reste côté serveur — jamais exposée au frontend.
 */
export async function callAnalyst(
  state: PortfolioState,
  messages: ChatMessage[]
): Promise<ChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-ant-xxxx")) {
    throw new Error(
      "Clé d'API manquante. Renseigne ANTHROPIC_API_KEY dans server/.env (voir .env.example)."
    );
  }

  const baseUrl = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "claude-sonnet-4-6";
  const version = process.env.ANTHROPIC_VERSION || "2023-06-01";
  const webSearch = (process.env.AI_WEB_SEARCH ?? "true").toLowerCase() !== "false";
  const maxUses = Number(process.env.AI_WEB_SEARCH_MAX_USES || 5);

  const maxTokens = Number(process.env.AI_MAX_TOKENS || 2048);

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    system: buildSystemPrompt(state),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  if (webSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: maxUses }];
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": version,
  };
  if (webSearch) {
    headers["anthropic-beta"] = "web-search-2025-03-05";
  }

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erreur API (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  // Concatène tous les blocs de type "text" (l'API peut renvoyer plusieurs
  // blocs entrecoupés d'appels à la recherche web).
  let text = "";
  let usedWebSearch = false;
  for (const block of data.content ?? []) {
    if (block.type === "text" && block.text) text += block.text;
    if (block.type === "server_tool_use" || block.type === "web_search_tool_result") {
      usedWebSearch = true;
    }
  }

  if (!text.trim()) text = "(Réponse vide de l'analyste.)";
  return { text: text.trim(), usedWebSearch };
}
