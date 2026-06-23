// Formatage FCFA, locale fr-FR, sans décimales.

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** Montant en FCFA, séparateurs de milliers, sans décimales. */
export function fcfa(n: number): string {
  return nf.format(Math.round(n || 0));
}

/** Nombre générique (ex. cours unitaire) avec jusqu'à 2 décimales. */
export function num(n: number): string {
  return nf2.format(n || 0);
}

/** Pourcentage signé, 1 décimale. */
export function pct(n: number): string {
  const v = n || 0;
  return `${v >= 0 ? "+" : ""}${nf2.format(v)}%`;
}

/** Montant FCFA signé (pour +/- values). */
export function signedFcfa(n: number): string {
  const v = Math.round(n || 0);
  return `${v >= 0 ? "+" : ""}${nf.format(v)}`;
}

/** Classe couleur gain/perte. */
export function pnlColor(n: number): string {
  if (n > 0) return "text-gain";
  if (n < 0) return "text-loss";
  return "text-forest-600";
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
