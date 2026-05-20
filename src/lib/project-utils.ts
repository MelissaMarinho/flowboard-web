/**
 * Derive a 3-character project key from the project name.
 * Takes the 1st, middle, and last letters (alphabetic only, uppercased).
 *
 * Examples:
 *   "test"           → "TST"  (T, E→mid, T)  wait: T(0),E(1),S(2),T(3) → first=T, mid=floor(3/2)=1→E, last=T → "TET"
 *   "flowboard"      → "FOD"  (F, O, D)
 *   "My Project"     → "MJT"  (M, J from MYPROJECT mid, T)
 */
export function deriveKey(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return "PRJ";
  const len = letters.length;
  if (len === 1) return letters[0].repeat(3);
  if (len === 2) return letters[0] + letters[0] + letters[1];
  const first = letters[0];
  const mid = letters[Math.floor((len - 1) / 2)];
  const last = letters[len - 1];
  return first + mid + last;
}

/**
 * Convert project name to title case.
 * "my project" → "My Project", "test" → "Test"
 */
export function toProjectName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
