/**
 * Minimal class-string joiner — zero-dependency `cn`.
 *
 * The original shadcn version pulled in clsx + tailwind-merge; the app's
 * Tailwind-only rule (workspace-elementa) means callers pass plain class
 * strings, so a filter + join is all that's needed.
 */
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const v of inputs) {
    if (typeof v === 'string' || typeof v === 'number') {
      if (v !== '') out.push(String(v));
    } else if (Array.isArray(v)) {
      const nested = cn(...v);
      if (nested) out.push(nested);
    }
  }
  return out.join(' ');
}
