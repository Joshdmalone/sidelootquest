import * as chrono from "chrono-node";

/**
 * Parse a task title and extract a natural-language date if present.
 * Returns { title (cleaned), dueAt (Date | null) }.
 *
 * Examples:
 *   "Ship landing page by Friday 5pm" -> { title: "Ship landing page", dueAt: <Fri 5pm> }
 *   "Email client tomorrow"           -> { title: "Email client", dueAt: <tomorrow> }
 *   "Pay taxes Mar 15"                -> { title: "Pay taxes", dueAt: <Mar 15> }
 */
export function parseTaskInput(input: string, ref: Date = new Date()): {
  title: string;
  dueAt: Date | null;
} {
  const results = chrono.parse(input, ref, { forwardDate: true });
  if (results.length === 0) {
    return { title: input.trim(), dueAt: null };
  }

  // Use the last recognized date phrase (usually at end of title).
  const result = results[results.length - 1];
  const dueAt = result.start.date();

  // Strip the matched phrase, plus common leading words ("by", "on", "at", "due").
  const before = input.slice(0, result.index);
  const after = input.slice(result.index + result.text.length);
  let title = (before + after).trim();
  title = title.replace(/\s+(by|on|at|due|before|until)\s*$/i, "").trim();
  title = title.replace(/\s{2,}/g, " ");

  if (!title) title = input.trim();
  return { title, dueAt };
}
