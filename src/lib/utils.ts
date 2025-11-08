import { parseSI } from "./si";

export function parseSamples(text: string): number[] {
  if (!text) return [];
  return text
    .split(/[\s,;]+/)
    .map(tok => parseSI(tok))
    .filter((x): x is number => typeof x === 'number' && isFinite(x));
}

export const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);