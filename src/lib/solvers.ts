import { Item, ItemType, Series } from "@/lib/units";

export function findClosestESeriesValue(nominal: number, seriesName: string): { value: number; deviation: number } {
  const series = Series.find(s => s.name === seriesName);
  if (!series) throw new Error(`Unknown series: ${seriesName}`);

  const exp = Math.floor(Math.log10(nominal));
  const base = nominal / Math.pow(10, exp);

  let closest = series.values[0];
  let minDiff = Math.abs(series.values[0] - base);
  for (const v of series.values) {
    const diff = Math.abs(v - base);
    if (diff < minDiff) {
      minDiff = diff;
      closest = v;
    }
  }

  const closestValue = closest * Math.pow(10, exp);
  const deviation = ((closestValue - nominal) / nominal) * 100;

  return { value: closestValue, deviation };
}

export function selectDividerByLeakage(
  Vin: number,
  VoutTarget: number,
  Imax: number,
  minSeriesName: string,
  maxSeriesName: string
): {
  series: string;
  R1: number;
  R2: number;
  I: number;
  Vout: number;
  errorPct: number;
} | null {
  if (!(Vin > 0) || !(VoutTarget > 0) || !(Imax > 0) || VoutTarget >= Vin) {
    throw new Error('Bad arguments: require Vin>0, 0<Vout<Vin, Imax>0');
  }

  const order = Series.map(s => s.name);
  const minIdx = Math.max(0, order.indexOf(minSeriesName));
  const maxIdx = Math.max(minIdx, order.indexOf(maxSeriesName));

  const k = (Vin - VoutTarget) / VoutTarget;
  const RtMin = Vin / Imax;
  const R2MinIdeal = RtMin / (1 + k);
  const decades = (x: number) => Math.floor(Math.log10(Math.max(x, 1e-12)));

  let best: {
    series: string; R1: number; R2: number; I: number; Vout: number; errorPct: number;
  } | null = null;

  for (let si = minIdx; si <= maxIdx; si++) {
    const seriesName = order[si];
    const series = Series.find(s => s.name === seriesName);
    if (!series) continue;

    const startDec = decades(R2MinIdeal);
    const maxDec = Math.min(startDec + 6, 9);
    for (let d = startDec; d <= maxDec; d++) {
      const base = Math.pow(10, d);
      for (const m of series.values) {
        const R2cand = m * base;
        if (R2cand < R2MinIdeal) continue;

        // Ideal R1 for this R2
        const R1ideal = k * R2cand;
        const nearest = findClosestESeriesValue(R1ideal, seriesName);
        const R1cand = nearest.value;

        const Rt = R1cand + R2cand;
        const I = Vin / Rt;
        if (I > Imax) continue;

        const Vout = Vin * (R2cand / Rt);
        const errorPct = (Vout - VoutTarget) / VoutTarget * 100;

        const pick = { series: seriesName, R1: R1cand, R2: R2cand, I, Vout, errorPct };
        if (!best || Math.abs(pick.errorPct) < Math.abs(best.errorPct)) {
          best = pick;
          if (Math.abs(best.errorPct) < 0.05) break;
        }
      }
      if (best && best.series === seriesName && Math.abs(best.errorPct) < 0.05) break;
    }
    if (best) return best;
  }

  return best; // null if nothing found at any series
}

export function getImpedance(item: Item, freq: number): [number, number, number] {
  if (ItemType.Resistor) {
    return [item.nominal * (1 - item.tolerance), item.nominal, item.nominal * (1 + item.tolerance)];
  }

  const X = 2 * Math.PI * freq * item.nominal;
  return ItemType.Inductor ? [
    X * (1 - item.tolerance), X, X * (1 + item.tolerance)
  ] : [
    1 / X * (1 - item.tolerance), 1 / X, 1 / X * (1 + item.tolerance)
  ];
}

export function getTraceResistance(w: number, l: number, t: number, ta: number): number {
  const ro: number = 1.724e-8; // copper resistivity
  const alpha: number = 3.93e-3; // temperature coefficient
  return ((ro * l) / (t * w)) * (1 + alpha * (ta - 20));
}

export function getTraceTransientCurrent(w: number, t: number, tp: number): number {
  if (tp <= 0) return Infinity;
  if (w <= 0 || t <= 0) return 0;

  const A_mil2 = ((w * t) * 1e6) / 0.00064516; // mm2 -> mil2

  const C = 0.0346;                      // copper constant (Onderdonk), mil²·s
  const I = A_mil2 * Math.sqrt(C / tp);  // Amperes
  return I;
}
