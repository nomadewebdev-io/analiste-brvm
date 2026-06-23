# Analyste BRVM — Suivi de portefeuille

Application web **locale** et **mono-utilisateur** pour suivre un portefeuille d'actions de la **BRVM** (zone UEMOA, cotation en FCFA/XOF), pensée pour un investisseur particulier qui place un montant fixe chaque mois, principalement pour les **dividendes**.

Elle permet de suivre les positions, la valorisation et les plus/moins-values, les dividendes encaissés, les versements mensuels, une répartition cible, et de **dialoguer avec un analyste IA** qui lit le portefeuille et peut chercher des informations à jour sur le web.

> ⚠️ **L'analyste IA ne constitue pas un conseil en investissement agréé.** Il fournit des analyses à but éducatif. Les décisions et les exécutions d'ordres reviennent entièrement à l'utilisateur, via sa SGI.

---

## 🔒 Sécurité (par conception)

- **Aucune connexion à un compte de courtage.** L'application ne se connecte à aucun broker et ne passe **aucun ordre**. Vous exécutez vos ordres vous-même via votre SGI, puis vous saisissez l'opération ici pour le suivi.
- **Aucun identifiant de courtage** n'est stocké (ni login, ni mot de passe, ni numéro de compte titres).
- **La clé d'API de l'IA reste côté serveur uniquement** (fichier `server/.env`, ignoré par git). Le navigateur n'a jamais la clé : tous les appels IA passent par un proxy backend local.

---

## 🧱 Stack

- **Frontend** : React + Vite + TypeScript + Tailwind CSS
- **Backend** : Node + Express (proxy IA + persistance locale)
- **Persistance** : fichier JSON local (`server/data/data.json`) — toutes les données restent sur votre machine
- **IA** : API Anthropic Messages (`claude-sonnet-4-6` par défaut) avec l'outil `web_search`. Endpoint et modèle configurables via `.env`.

---

## 🚀 Installation & lancement

Prérequis : **Node.js ≥ 18** (testé avec Node 24).

### 1. Installer les dépendances

À la racine du projet (npm workspaces installe back **et** front d'un coup) :

```bash
npm install
```

### 2. Configurer la clé d'API de l'IA

Copiez l'exemple et renseignez votre clé Anthropic :

```bash
# Windows (PowerShell)
Copy-Item .env.example server/.env

# macOS / Linux
cp .env.example server/.env
```

Puis ouvrez `server/.env` et remplacez la valeur de `ANTHROPIC_API_KEY` par votre vraie clé
(obtenue sur https://console.anthropic.com).

> Le fichier `server/.env` est listé dans `.gitignore` : il ne sera jamais committé.
> Sans clé, l'application fonctionne entièrement **sauf** l'onglet « Analyste IA ».

### 3. Lancer (back + front en une commande)

```bash
npm run dev
```

- Frontend : http://localhost:5173
- Backend : http://localhost:8787 (le frontend l'appelle automatiquement via un proxy `/api`)

Ouvrez **http://localhost:5173** dans votre navigateur.

> Au premier lancement, l'application démarre avec un jeu de données d'exemple. Cliquez sur **Tout effacer** dans l'en-tête pour partir d'un portefeuille vierge.

> Besoin de deux terminaux séparés ? `npm run dev:server` d'un côté, `npm run dev:web` de l'autre.

### 4. (Optionnel) Build de production

```bash
npm run build          # build le frontend dans web/dist
npm start              # le backend sert alors aussi le frontend buildé sur http://localhost:8787
```

---

## ⚙️ Configuration (`server/.env`)

| Variable | Rôle | Défaut |
|---|---|---|
| `PORT` | Port du backend | `8787` |
| `ANTHROPIC_API_KEY` | Clé d'API (côté serveur uniquement) | — |
| `ANTHROPIC_BASE_URL` | Endpoint Messages API (modifiable pour router vers un proxy local) | `https://api.anthropic.com` |
| `ANTHROPIC_VERSION` | Version d'API | `2023-06-01` |
| `AI_MODEL` | Modèle utilisé | `claude-sonnet-4-6` |
| `AI_WEB_SEARCH` | Activer la recherche web (`true`/`false`) | `true` |
| `AI_WEB_SEARCH_MAX_USES` | Nb max de recherches par message | `5` |
| `AI_MAX_TOKENS` | Nb max de tokens dans la réponse de l'analyste | `2048` |

Pour router vers un proxy local compatible Anthropic, modifiez `ANTHROPIC_BASE_URL`
(ex. `http://localhost:4000`) et, si besoin, `AI_MODEL`.

---

## 🧭 Utilisation

- **Tableau de bord** : valorisation, montant investi, +/- value latente, dividendes cumulés, plus-value réalisée, et encart « Versements ».
- **Positions** : lignes ouvertes, PRU, **cours actuel éditable** (clic sur le cours), poids vs cible.
- **Saisie** : enregistrer un **achat**, une **vente** ou un **dividende** (autocomplétion des tickers BRVM courants ; tickers libres autorisés).
- **Versements** : enregistrer chaque dépôt mensuel ; graphique capital déposé vs valorisation.
- **Cibles** : définir un % cible par valeur ; écart réel/cible et lignes qui débordent.
- **Analyste IA** : chat qui lit votre portefeuille réel, peut chercher sur le web, avec boutons de questions rapides.

Les positions sont recalculées en **rejouant les transactions par date** (coût moyen pondéré ; plus-value réalisée sur les ventes). Les frais sont intégrés au prix de revient.

Boutons d'en-tête : **Données d'exemple** (recharge un jeu de démonstration) et **Tout effacer** (repart à zéro).

---

## 🧪 Tests

Tests unitaires sur le coût moyen pondéré et la plus-value réalisée :

```bash
npm test
```

---

## 🗂️ Arborescence

```
analiste/
├─ package.json            # workspaces + scripts (dev/test/build)
├─ .env.example            # modèle de configuration (à copier vers server/.env)
├─ .gitignore              # ignore node_modules, .env, data.json
├─ README.md
├─ server/                 # backend Express
│  ├─ src/
│  │  ├─ index.ts          # routes API + serveur
│  │  ├─ db.ts             # persistance JSON locale
│  │  ├─ portfolio.ts      # calculs (coût moyen, +/-value, séries)
│  │  ├─ portfolio.test.ts # tests unitaires
│  │  ├─ ai.ts             # proxy IA + system prompt (garde-fous)
│  │  ├─ tickers.ts        # référentiel BRVM
│  │  ├─ seed.ts           # données d'exemple
│  │  └─ types.ts
│  └─ data/data.json       # base locale (créée au 1er lancement, ignorée par git)
└─ web/                    # frontend React + Vite + Tailwind
   └─ src/
      ├─ App.tsx
      ├─ api.ts, format.ts, types.ts
      └─ components/        # Dashboard, Positions, TransactionForm, Deposits, Targets, Analyst, ProgressChart, ui
```

---

## ❌ Hors-périmètre (volontairement non implémenté)

- Pas d'exécution d'ordres, pas d'intégration broker, pas de scraping de cours temps réel (saisie manuelle).
- Pas d'authentification multi-utilisateurs (mono-utilisateur local).
- Aucune clé d'API exposée côté client.
