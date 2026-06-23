import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "./types.js";
import { emptyDatabase, seedDatabase } from "./seed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DATA_FILE = join(DATA_DIR, "data.json");

let cache: Database | null = null;

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function persist(db: Database): void {
  ensureDir();
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

/** Charge la base depuis le disque (ou crée le fichier avec le seed au 1er lancement). */
export function load(): Database {
  if (cache) return cache;
  ensureDir();
  if (!existsSync(DATA_FILE)) {
    const seeded = seedDatabase();
    persist(seeded);
    cache = seeded;
    return cache;
  }
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    cache = {
      transactions: parsed.transactions ?? [],
      prices: parsed.prices ?? {},
      targets: parsed.targets ?? {},
      deposits: parsed.deposits ?? [],
    };
    return cache;
  } catch (err) {
    console.error("Lecture de data.json impossible, démarrage à vide:", err);
    cache = emptyDatabase();
    return cache;
  }
}

/** Applique une mutation puis sauvegarde sur disque. */
export function update(mutator: (db: Database) => void): Database {
  const db = load();
  mutator(db);
  persist(db);
  return db;
}

export function reset(withSeed: boolean): Database {
  cache = withSeed ? seedDatabase() : emptyDatabase();
  persist(cache);
  return cache;
}
