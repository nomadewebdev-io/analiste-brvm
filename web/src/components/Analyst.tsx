import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types.ts";
import { api } from "../api.ts";
import { Button, Card, Disclaimer, SectionTitle } from "./ui.tsx";

const QUICK = [
  "Analyse ma répartition",
  "Suis-je bien diversifié ?",
  "Quelles dates de dividendes surveiller ?",
];

export function Analyst() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError("");
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await api.chat(next);
      const suffix = res.usedWebSearch ? "\n\n_🔎 Réponse appuyée sur une recherche web._" : "";
      setMessages([...next, { role: "assistant", content: res.text + suffix }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex h-[calc(100vh-180px)] min-h-[520px] flex-col p-5">
      <SectionTitle
        title="Analyste IA"
        subtitle="Lit ton portefeuille réel et peut chercher des informations à jour sur le web."
        right={
          messages.length > 0 ? (
            <Button variant="ghost" onClick={() => setMessages([])}>
              Effacer
            </Button>
          ) : undefined
        }
      />

      <div className="mb-3">
        <Disclaimer />
      </div>

      {/* Questions rapides */}
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={busy}
            className="rounded-full border border-forest-200 px-3 py-1.5 text-xs text-forest-700 transition hover:bg-forest-50 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Fil de discussion */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg bg-parchment/50 p-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-forest-400">
            Pose une question à ton analyste, ou utilise un bouton ci-dessus.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-forest-700 text-white"
                  : "border border-forest-100 bg-white text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-forest-100 bg-white px-4 py-2.5 text-sm text-forest-400">
              L'analyste réfléchit…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="mt-2 text-sm text-loss">{error}</p>}

      {/* Saisie */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex. : Mon poids sur Sonatel est-il trop élevé ?"
          className="num flex-1 rounded-lg border border-forest-200 bg-white px-3 py-2 text-sm focus:border-forest-400"
          style={{ fontFamily: "inherit" }}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          Envoyer
        </Button>
      </form>
    </Card>
  );
}
