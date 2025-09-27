import { useMemo, useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { Select } from '@/ui/components/Select';
import { ResultCard } from '@/ui/components/ResultCard';
import { parseSI, formatSI } from "@/lib/si";

function clampPos(x: number): number { return Number.isFinite(x) && x > 0 ? x : 0; }
function fmt(n: number, unit: string, digits = 6): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return `0 ${unit}`;
  const abs = Math.abs(n);
  const prefixes: [number, string][] = [
    [1e-12, 'p'], [1e-9, 'n'], [1e-6, 'µ'], [1e-3, 'm'], [1, ''], [1e3, 'k'], [1e6, 'M'], [1e9, 'G']
  ];
  let scale = 1, s = '';
  for (let i = prefixes.length - 1; i >= 0; i--) {
    if (abs >= prefixes[i][0]) { scale = prefixes[i][0]; s = prefixes[i][1]; break; }
  }
  const val = n / scale;
  return `${val.toPrecision(digits)} ${s}${unit}`;
}
function db20(x: number): number { return Number.isFinite(x) && x > 0 ? 20 * Math.log10(x) : -Infinity; }
function rad2deg(r: number): number { return r * 180 / Math.PI; }

const NETS = [
  { value: 'RC', label: 'RC' },
  { value: 'RL', label: 'RL' },
  { value: 'LC', label: 'LC' },
  { value: 'RLC', label: 'RLC' },
] as const;

type Net = typeof NETS[number]['value'];

const TOPO: Record<Net, { value: string; label: string }[]> = {
  RC: [
    { value: 'lp', label: 'Low-pass (Rs, C to GND)' },
    { value: 'hp', label: 'High-pass (Cs, R to GND)' },
  ],
  RL: [
    { value: 'lp', label: 'Low-pass (Ls, R to GND)' },
    { value: 'hp', label: 'High-pass (Rs, L to GND)' },
  ],
  LC: [
    { value: 'series', label: 'Series LC' },
    { value: 'parallel', label: 'Parallel LC' },
  ],
  RLC: [
    { value: 'series', label: 'Series RLC' },
    { value: 'parallel', label: 'Parallel RLC' },
  ],
};

export function RLCNetwork() {
  const [net, setNet] = useState<Net>('RC');
  const [topo, setTopo] = useState<string>('lp');

  const [R, setR] = useState<string>('1k');
  const [L, setL] = useState<string>('1m');
  const [C, setC] = useState<string>('1u');
  const [F, setF] = useState<string>('1k');

  const topoOpts = TOPO[net];
  useMemo(() => {
    if (!topoOpts.find(o => o.value === topo)) setTopo(topoOpts[0].value);
  }, [net]);

  const r = clampPos((parseSI(R) ?? 0));
  const l = clampPos((parseSI(L) ?? 0));
  const c = clampPos((parseSI(C) ?? 0));
  const f = clampPos((parseSI(F) ?? 0));
  const w = 2 * Math.PI * f;

  const tauRC = r > 0 && c > 0 ? r * c : 0;
  const fcRC = tauRC > 0 ? 1 / (2 * Math.PI * tauRC) : 0;

  const tauRL = r > 0 ? (l / r) : 0;
  const fcRL = (l > 0 && r > 0) ? r / (2 * Math.PI * l) : 0;

  const w0 = (l > 0 && c > 0) ? 1 / Math.sqrt(l * c) : 0;
  const f0 = w0 / (2 * Math.PI);

  let Hmag = 0;
  let Hph = 0;
  let Zmag = 0;

  if (net === 'RC') {
    if (topo === 'lp') {
      // H = 1/(1 + j wRC)
      const a = w * tauRC;
      Hmag = tauRC > 0 ? 1 / Math.sqrt(1 + a * a) : 0;
      Hph = tauRC > 0 ? -Math.atan(a) : 0;
      // Input Z is R in series with C to GND -> |Zin| = sqrt(R^2 + (1/(wC))^2)
      const Xc = (w > 0 && c > 0) ? 1 / (w * c) : Infinity;
      Zmag = Number.isFinite(Xc) ? Math.sqrt(r * r + Xc * Xc) : r;
    } else {
      // HP: H = j wRC / (1 + j wRC)
      const a = w * tauRC;
      Hmag = tauRC > 0 ? a / Math.sqrt(1 + a * a) : 0;
      Hph = tauRC > 0 ? Math.atan(1 / a) - Math.PI / 2 : 0; // ≈ -90° at low f, 0° at high f
      // Input Z: C series then R to GND -> |Zin| = sqrt(R^2 + (1/(wC))^2)
      const Xc = (w > 0 && c > 0) ? 1 / (w * c) : Infinity;
      Zmag = Number.isFinite(Xc) ? Math.sqrt(r * r + Xc * Xc) : r;
    }
  } else if (net === 'RL') {
    if (topo === 'lp') {
      // H = 1/(1 + j wL/R)
      const a = (r > 0) ? (w * l / r) : 0;
      Hmag = (r > 0 && l > 0) ? 1 / Math.sqrt(1 + a * a) : 0;
      Hph = (r > 0 && l > 0) ? -Math.atan(a) : 0;
      const Xl = w * l;
      Zmag = Math.sqrt(r * r + Xl * Xl);
    } else {
      // HP: H = j wL/R / (1 + j wL/R)
      const a = (r > 0) ? (w * l / r) : 0;
      Hmag = (r > 0 && l > 0) ? a / Math.sqrt(1 + a * a) : 0;
      Hph = (r > 0 && l > 0) ? Math.atan(1 / a) - Math.PI / 2 : 0;
      const Xl = w * l;
      Zmag = Math.sqrt(r * r + Xl * Xl);
    }
  } else if (net === 'LC') {
    if (topo === 'series') {
      const Xl = w * l;
      const Xc = (w > 0 && c > 0) ? 1 / (w * c) : Infinity;
      const X = Number.isFinite(Xc) ? (Xl - Xc) : Xl;
      Zmag = Math.abs(X); // ideal series LC has zero R
      Hmag = 1; Hph = 0; // No defined voltage transfer without a load; show impedance only
    } else {
      // parallel LC admittance magnitude
      const Xl = w * l;
      const Xc = (w > 0 && c > 0) ? 1 / (w * c) : Infinity;
      const Bl = (Xl !== 0) ? -1 / Xl : -Infinity; // susceptance of L
      const Bc = Number.isFinite(Xc) && Xc !== 0 ? 1 / Xc : 0; // susceptance of C
      const B = (Number.isFinite(Bl) ? Bl : 0) + Bc;
      Zmag = (B !== 0) ? 1 / Math.abs(B) : Infinity;
      Hmag = 1; Hph = 0;
    }
  } else if (net === 'RLC') {
    if (topo === 'series') {
      const Xl = w * l;
      const Xc = (w > 0 && c > 0) ? 1 / (w * c) : Infinity;
      const X = Number.isFinite(Xc) ? (Xl - Xc) : Xl;
      Zmag = Math.sqrt(r * r + X * X);
    } else {
      // parallel RLC: Y = 1/R + j(ωC − 1/(ωL))
      const G = r > 0 ? 1 / r : 0;
      const B = (c > 0 && w > 0 ? w * c : 0) - (l > 0 && w > 0 ? 1 / (w * l) : 0);
      const Ymag = Math.sqrt(G * G + B * B);
      Zmag = (Ymag > 0) ? 1 / Ymag : Infinity;
    }
    // Q, ζ, BW
    const Qs = (r > 0) ? (w0 * l / r) : 0;      // series
    const Qp = (l > 0 && w0 > 0) ? (r / (w0 * l)) : 0; // parallel (ideal equivalence)
  }

  const rows: { label: preact.ComponentChildren; value: string; value_min?: string; value_max?: string }[] = [];

  rows.push({ label: 'Frequency', value: fmt(f, 'Hz') });

  if (net === 'RC') {
    rows.push({ label: <>τ = R·C</>, value: fmt(tauRC, 's') });
    rows.push({ label: <>f_c</>, value: fmt(fcRC, 'Hz') });
    rows.push({ label: <>|H(jω)|</>, value: `${Hmag.toPrecision(4)} ( ${db20(Hmag).toFixed(2)} dB )` });
    rows.push({ label: <>∠H(jω)</>, value: `${rad2deg(Hph).toFixed(2)} °` });
    rows.push({ label: <>|Z_in|</>, value: fmt(Zmag, 'Ω') });
  } else if (net === 'RL') {
    rows.push({ label: <>τ = L/R</>, value: fmt(tauRL, 's') });
    rows.push({ label: <>f_c</>, value: fmt(fcRL, 'Hz') });
    rows.push({ label: <>|H(jω)|</>, value: `${Hmag.toPrecision(4)} ( ${db20(Hmag).toFixed(2)} dB )` });
    rows.push({ label: <>∠H(jω)</>, value: `${rad2deg(Hph).toFixed(2)} °` });
    rows.push({ label: <>|Z_in|</>, value: fmt(Zmag, 'Ω') });
  } else if (net === 'LC') {
    rows.push({ label: <>f₀</>, value: fmt(f0, 'Hz') });
    rows.push({ label: topo === 'series' ? <>|Z_series|</> : <>|Z_parallel|</>, value: Number.isFinite(Zmag) ? fmt(Zmag, 'Ω') : '∞' });
  } else if (net === 'RLC') {
    const Qs = (r > 0 && w0 > 0) ? (w0 * l / r) : 0;
    const Qp = (l > 0 && w0 > 0) ? (r / (w0 * l)) : 0;
    const Q = topo === 'series' ? Qs : Qp;
    const zeta = Q > 0 ? 1 / (2 * Q) : 0;
    const BW = Q > 0 ? (f0 / Q) : 0;

    rows.push({ label: <>f₀</>, value: fmt(f0, 'Hz') });
    rows.push({ label: <>Q</>, value: Number.isFinite(Q) ? Q.toPrecision(4) : '—' });
    rows.push({ label: <>ζ</>, value: Number.isFinite(zeta) ? zeta.toPrecision(4) : '—' });
    rows.push({ label: <>BW</>, value: fmt(BW, 'Hz') });
    rows.push({ label: topo === 'series' ? <>|Z_series|</> : <>|Z_parallel|</>, value: Number.isFinite(Zmag) ? fmt(Zmag, 'Ω') : '∞' });
  }

  return (
    <div class="grid cols-2">
      <div>
        <div class="grid cols-2">
          <Select label="Network" value={net} onChange={(v) => setNet(v as Net)} options={NETS as any} />
          <Select label="Topology" value={topo} onChange={(v) => setTopo(v)} options={topoOpts as any} />
        </div>
        {net !== 'LC' && <Input label="R" value={R} onChange={setR} suffix="Ω" placeholder="1k" />}
        <Input label="L" value={L} onChange={setL} suffix="H" placeholder="1m" />
        <Input label="C" value={C} onChange={setC} suffix="F" placeholder="1u" />
        <Input label="Frequency" value={F} onChange={setF} suffix="Hz" placeholder="1M" />
      </div>

      <div>
        <ResultCard rows={rows} />
      </div>
    </div>
  );
}