import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export const formatXAF = (n: number) =>
  new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

export const formatNumber = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const safeParse = (value: string) => {
  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = safeParse(value);
  return date && !isNaN(date.getTime()) ? format(date, "dd/MM/yyyy") : "—";
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = safeParse(value);
  return date && !isNaN(date.getTime()) ? format(date, "dd/MM/yyyy HH:mm:ss") : "—";
};

export const formatRelative = (value?: string | null) => {
  if (!value) return "Jamais";
  const date = safeParse(value);
  if (!date || isNaN(date.getTime())) return "Jamais";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
};

export const toISODate = (date: Date) => format(date, "yyyy-MM-dd");

export const defaultRange = (days: number) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: toISODate(from), to: toISODate(to) };
};
