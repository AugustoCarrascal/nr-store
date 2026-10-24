// Todo el panel trabaja con hora de Argentina (UTC-3, sin horario de verano).
const AR_OFFSET_MS = 3 * 60 * 60 * 1000;

export type YearMonth = { year: number; month0: number };

export function normalizeMonth(year: number, month0: number): YearMonth {
  const d = new Date(Date.UTC(year, month0, 1));
  return { year: d.getUTCFullYear(), month0: d.getUTCMonth() };
}

export function currentMonth(): YearMonth {
  const d = new Date(Date.now() - AR_OFFSET_MS);
  return { year: d.getUTCFullYear(), month0: d.getUTCMonth() };
}

/** Instante UTC en que empieza el mes en Argentina (00:00 AR = 03:00 UTC). */
export function monthStart(year: number, month0: number): Date {
  return new Date(Date.UTC(year, month0, 1, 3, 0, 0));
}

export function monthKey(year: number, month0: number): string {
  const n = normalizeMonth(year, month0);
  return `${n.year}-${String(n.month0 + 1).padStart(2, "0")}`;
}

export function monthKeyOf(iso: string): string {
  const d = new Date(new Date(iso).getTime() - AR_OFFSET_MS);
  return monthKey(d.getUTCFullYear(), d.getUTCMonth());
}

export function parseMonth(param?: string): YearMonth {
  const m = param?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const month0 = Number(m[2]) - 1;
    if (month0 >= 0 && month0 <= 11) return { year: Number(m[1]), month0 };
  }
  return currentMonth();
}

export function monthName(year: number, month0: number): string {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month0, 1))
  );
}

export function monthShort(year: number, month0: number): string {
  return new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month0, 1))
  );
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
}

export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}
