import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-forest-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-forest-800">{title}</h2>
        {subtitle && <p className="text-sm text-forest-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-forest-700">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  "rounded-lg border border-forest-200 bg-parchment/40 px-3 py-2 text-sm text-ink " +
  "focus:border-forest-400 focus:bg-white";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "gold";
}) {
  const styles = {
    primary: "bg-forest-700 text-white hover:bg-forest-800",
    gold: "bg-gold-500 text-white hover:bg-gold-600",
    ghost: "border border-forest-200 text-forest-700 hover:bg-forest-50",
    danger: "border border-loss/40 text-loss hover:bg-loss/5",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

export function Disclaimer() {
  return (
    <div className="rounded-lg border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-xs text-forest-700">
      ⚠️ Les analyses de l'IA sont fournies à but éducatif et{" "}
      <strong>ne constituent pas un conseil en investissement agréé</strong>.
      L'application ne se connecte à aucun courtage et ne passe aucun ordre.
    </div>
  );
}
