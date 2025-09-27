import { ozToUmMap } from "./si";

export function microstripZoFormula(h_mm: number, w_mm: number, copperWeight: string, er: number): number {
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t_mm = t_um / 1000;
  const lnTerm = Math.log((5.98 * h_mm) / (0.8 * w_mm + t_mm));
  const factor = 87 / Math.sqrt(er + 1.41);
  return factor * lnTerm;
}

/**
 * Hammerstad–Jensen microstrip characteristic impedance
 */
export function microstripZoHammerstadFormula(
  h_mm: number,
  w_mm: number,
  copperWeight: string,
  er: number,
  useThicknessCorr = false
): number {
  const h = Math.max(h_mm, 1e-12);
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t = Math.max(t_um / 1000, 0); // mm

  let we = Math.max(w_mm, 1e-12);

  if (useThicknessCorr && t > 0) {
    const u = we / h;
    const du = (t / Math.PI) * (1 + 1 / (1 + 1 / u));
    we = we + du;
  }

  const ueff = we / h;

  const F = (1 + 12 / ueff) ** -0.5;
  const eps_eff = (er + 1) / 2 + (er - 1) / 2 * (F + 0.04 * (1 - ueff) ** 2);

  let Z0: number;
  if (ueff <= 1) {
    Z0 = (60 / Math.sqrt(eps_eff)) * Math.log(8 / ueff + 0.25 * ueff);
  } else {
    Z0 = (120 * Math.PI) / (Math.sqrt(eps_eff) * (ueff + 1.393 + 0.667 * Math.log(ueff + 1.444)));
  }
  return Z0;
}

export function striplineZoFormula(h_mm: number, w_mm: number, copperWeight: string, er: number): number {
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t_mm = t_um / 1000;
  const numerator = 1.9 * (2 * h_mm + t_mm);
  const denominator = 0.8 * w_mm + t_mm;
  const lnTerm = Math.log(numerator / denominator);
  const factor = 60 / Math.sqrt(er);
  return factor * lnTerm;
}

export function embeddedMicrostripZoFormula(
  h_mm: number,
  hp_mm: number,
  w_mm: number,
  copperWeight: string,
  er: number
): number {
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t_mm = t_um / 1000;

  const ratio = hp_mm > 0 ? (h_mm / hp_mm) : 0;
  const erp = er * (1 - Math.exp(-1.55 * ratio));

  const numerator = 5.98 * hp_mm;
  const denominator = 0.8 * w_mm + t_mm;
  const lnTerm = Math.log(numerator / denominator);
  const factor = 60 / Math.sqrt(erp || er || 1e-12);
  return factor * lnTerm;
}

export function asymmetricStriplineZoFormula(
  ha_mm: number,
  hb_mm: number,
  w_mm: number,
  copperWeight: string,
  er: number
): number {
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t_mm = t_um / 1000;

  const numerator = 1.9 * (2 * ha_mm + t_mm);
  const denominator = 0.8 * w_mm + t_mm;
  const lnTerm = Math.log(numerator / denominator);
  const asymFactor = 1 - (hb_mm !== 0 ? (ha_mm / (4 * hb_mm)) : 0);
  const factor = 80 / Math.sqrt(er);
  return factor * lnTerm * asymFactor;
}

export function edgeCoupledMicrostripZoFormula(
  h_mm: number,
  w_mm: number,
  s_mm: number,
  copperWeight: string,
  er: number
): number {
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t_mm = t_um / 1000;

  const baseLn = Math.log((5.98 * h_mm) / (0.8 * w_mm + t_mm));
  const coupling = 1 - 0.48 * Math.exp(-0.96 * (s_mm / (h_mm || 1e-12)));
  const factor = 174 / Math.sqrt(er + 1.41);
  return factor * baseLn * coupling;
}

export function broadsideCoupledStriplineZoFormula(
  hp_mm: number,
  ht_mm: number,
  w_mm: number,
  copperWeight: string,
  er: number
): number {
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t_mm = t_um / 1000;

  const numerator = 1.9 * (2 * hp_mm + t_mm);
  const denominator = 0.8 * w_mm + t_mm;
  const lnTerm = Math.log(numerator / denominator);

  const correction = 1 - (hp_mm / (4 * (ht_mm + hp_mm + t_mm)));
  const factor = 80 / Math.sqrt(er);

  return factor * lnTerm * correction;
}

export function edgeCoupledStriplineZoFormula(
  h_mm: number,
  w_mm: number,
  s_mm: number,
  copperWeight: string,
  er: number
): { z0: number; zd: number } {
  const t_um = ozToUmMap[copperWeight] ?? 35;
  const t_mm = t_um / 1000;

  const numerator = 1.9 * (2 * h_mm + t_mm);
  const denominator = 0.8 * w_mm + t_mm;
  const lnTerm = Math.log(numerator / denominator);
  const z0 = (60 / Math.sqrt(er)) * lnTerm;

  const coupling = 1 - 0.347 * Math.exp((-2.9 * s_mm) / (2 * h_mm + t_mm));
  const zd = 2 * z0 * coupling;

  return { z0, zd };
}
