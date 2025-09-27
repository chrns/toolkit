export function parseSI(raw: string): number | null {
  if (!raw) return null;

  let s = raw.trim()
    .replace(/[, _]/g, '')
    .replace(/ohms?/i, '')
    .replace(/Ω/g, '')
    .replace(/^[-+]?$/, '');

  if (!s) return null;

  if (/^[+-]?\d+(?:\.\d+)?e[+-]?\d+$/i.test(s)) return Number(s);

  const MULT: Record<string, number> = {
    '': 1,
    'T': 1e12, 'G': 1e9, 'M': 1e6, 'K': 1e3, 'k': 1e3,
    'm': 1e-3, 'u': 1e-6, 'µ': 1e-6, 'n': 1e-9, 'p': 1e-12, 'f': 1e-15,
  };

  const m1 = s.match(/^([+-]?\d*(?:\.\d+)?)([TGMKkmunpfµ]?)$/);
  if (m1 && m1[1] !== '') {
    const [, num, suf] = m1;
    const k = suf || '';
    const mult = MULT[k] ?? null;
    if (mult == null) return null;
    return Number(num) * mult;
  }

  const m2 = s.match(/^([+-]?\d+)([TGMKkmunpRµf])(\d*)$/);
  if (m2) {
    const [, whole, mark, frac] = m2;
    if (mark === 'R') {
      const val = Number(`${whole}.${frac || '0'}`);
      return isFinite(val) ? val : null;
    }
    const mult = MULT[mark] ?? null;
    if (mult == null) return null;
    const dec = Number(`${whole}.${frac || '0'}`);
    return isFinite(dec) ? dec * mult : null;
  }

  const n = Number(s);
  return isFinite(n) ? n : null;
}

export function formatSI(value: number, unit = '', digits = 3): string {
  if (!isFinite(value)) return '—';
  const abs = Math.abs(value);
  const pairs: [number, string][] = [
    [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'],
    [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'], [1e-15, 'f'],
  ];
  const [m, s] = pairs.find(([m]) => abs >= m) ?? [1, ''];
  const v = value / m;
  const str = (Math.abs(v) >= 100 ? v.toFixed(0)
    : Math.abs(v) >= 10 ? v.toFixed(1)
      : v.toFixed(digits - 1));
  return unit ? `${str}${s}${unit}` : `${str}${s}`;
}

export const ozToUmMap: Record<string, number> = { '0.5oz': 17.5, '1oz': 35, '1.5oz': 52.5, '2oz': 70, '2.5oz': 87.5, '3oz': 105, '4oz': 140, '5oz': 175 };
