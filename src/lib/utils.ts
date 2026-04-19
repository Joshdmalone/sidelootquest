import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${dollars.toLocaleString("en-US", {
      minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${dollars.toFixed(dollars % 1 === 0 ? 0 : 2)}`;
}

export function formatMoneyShort(cents: number | null | undefined): string {
  if (cents == null) return "$0";
  const dollars = cents / 100;
  if (dollars >= 10000) return `$${(dollars / 1000).toFixed(1)}k`;
  return formatMoney(cents);
}

export function centsFromDollars(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.round(seconds / 60)}m`;
  return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
}
