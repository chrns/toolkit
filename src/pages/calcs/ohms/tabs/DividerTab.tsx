import { parseSI, formatSI } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { Select } from "@/ui/components/Select";
import { ResultCard } from "@/ui/components/ResultCard";
import { useState, useEffect, useMemo } from "preact/hooks";
import {
  defaultToleranceR, defaultResistance, defaultVoltage, defaultFrequency,
  resistancePlaceholder, voltagePlaceholder, currentPlaceholder, defaultCapacitance,
  defaultACVoltage, defaultInductance, capacitancePlaceholder, inductancePlaceholder,
  frequencyPlaceholder
} from '../../shared';

export function DividerTab() {
  type Solver = 'R' | 'L' | 'C';
  const [rlcSolveFor, setRlcSolveFor] = useState<Solver>('R');
  const [Voltage, setVoltage] = useState(defaultVoltage);
  const [Value1, setValue_1] = useState(defaultResistance);
  const [Value2, setValue_2] = useState(defaultResistance);
  const [Tol1, setTol1] = useState<number>(defaultToleranceR);
  const [Tol2, setTol2] = useState<number>(defaultToleranceR);
  const [Freq, setFreq] = useState(defaultFrequency);
  // Load mode state
  const [loadMode, setLoadMode] = useState<'none' | 'R' | 'I'>('none');
  const [Rload, setRload] = useState('10k');
  const [Iload, setIload] = useState('1m');
  const suffixMap: Record<Solver, string> = { R: 'Ω', L: 'H', C: 'F' };

  useEffect(() => {
    if (rlcSolveFor === 'R') {
      setValue_1(defaultResistance);
      setValue_2(defaultResistance);
      setVoltage(defaultVoltage);
    } else if (rlcSolveFor === 'C') {
      setValue_1(defaultCapacitance);
      setValue_2(defaultCapacitance);
      setVoltage(defaultACVoltage);
    } else if (rlcSolveFor === 'L') {
      setValue_1(defaultInductance);
      setValue_2(defaultInductance);
      setVoltage(defaultACVoltage);
    }
  }, [rlcSolveFor]);

  useEffect(() => {
    if (rlcSolveFor !== 'R' && loadMode === 'I') {
      setLoadMode('R'); // current-mode is not applicable for C/L; switch to R-load
    }
  }, [rlcSolveFor]);

  const Result = 0;

  const solved = useMemo(() => {
    const voltage = parseSI(Voltage) ?? 0;
    const val1 = parseSI(Value1) ?? 0;
    const val2 = parseSI(Value2) ?? 0;
    const freq = parseSI(Freq) ?? 0;
    const w = 2 * Math.PI * Math.max(0, freq);
    // Parse load fields
    const rload = parseSI(Rload) ?? 0;
    const iload = parseSI(Iload) ?? 0;

    let out = {
      Result: 0,
      ResultMin: 0,
      ResultMax: 0,
      k: 0,
      kMin: 0,
      kMax: 0,
      I: 0,
      IMin: 0,
      IMax: 0,
      Zout: 0,
      ZoutMin: 0,
      ZoutMax: 0,
      // R-specific
      Vth: 0, VthMin: 0, VthMax: 0,
      Rth: 0, RthMin: 0, RthMax: 0,
      dV: 0, dVMin: 0, dVMax: 0,
      PR1: 0, PR1Min: 0, PR1Max: 0,
      PR2: 0, PR2Min: 0, PR2Max: 0,
      // C/L-specific
      X1: 0, X1Min: 0, X1Max: 0,
      X2: 0, X2Min: 0, X2Max: 0,
    } as any;

    const t1 = Math.max(0, Tol1) / 100;
    const t2 = Math.max(0, Tol2) / 100;

    const cornersOf = <T extends any>(vals: [number, number], cb: (a: number, b: number) => T): T[] => {
      const [a, b] = vals;
      const aMin = a * (1 - t1), aMax = a * (1 + t1);
      const bMin = b * (1 - t2), bMax = b * (1 + t2);
      return [
        cb(aMin, bMin),
        cb(aMin, bMax),
        cb(aMax, bMin),
        cb(aMax, bMax),
      ];
    };

    if (rlcSolveFor === 'R') {
      const R1 = val1; const R2 = val2;

      const voutWith = (r1: number, r2: number) => {
        if (loadMode === 'R' && rload > 0) {
          const rpar = (r2 * rload) / (r2 + rload);
          return (rpar > 0) ? voltage * (rpar / (r1 + rpar)) : 0;
        }
        if (loadMode === 'I' && iload > 0) {
          const vth = (r1 + r2) > 0 ? voltage * (r2 / (r1 + r2)) : 0;
          const rth = (r1 + r2) > 0 ? (r1 * r2) / (r1 + r2) : 0;
          return Math.max(0, vth - iload * rth);
        }
        return (r1 + r2) > 0 ? voltage * (r2 / (r1 + r2)) : 0;
      };

      // Thevenin (no-load)
      const Vth = (R1 + R2) > 0 ? voltage * (R2 / (R1 + R2)) : 0;
      const Rth = (R1 + R2) > 0 ? (R1 * R2) / (R1 + R2) : 0;

      out.Result = voutWith(R1, R2);
      const cornerV = cornersOf([R1, R2], (a, b) => voutWith(a, b));
      out.ResultMin = Math.min(...cornerV);
      out.ResultMax = Math.max(...cornerV);

      // k = Vout/Vin
      out.k = voltage > 0 ? out.Result / voltage : 0;
      out.kMin = voltage > 0 ? out.ResultMin / voltage : 0;
      out.kMax = voltage > 0 ? out.ResultMax / voltage : 0;

      // Source current (through R1): I = (Vin - Vout)/R1
      const isrc = (r1: number, vout: number) => (r1 > 0 ? (voltage - vout) / r1 : 0);
      out.I = isrc(R1, out.Result);
      const Icorners = cornersOf([R1, R2], (a, b) => isrc(a, voutWith(a, b)));
      out.IMin = Math.min(...Icorners);
      out.IMax = Math.max(...Icorners);

      // Zout (Thevenin) = R1 || R2 (no-load)
      const zout = (a: number, b: number) => (a + b) > 0 ? (a * b) / (a + b) : 0;
      out.Zout = zout(R1, R2);
      const Zcorners = cornersOf([R1, R2], zout);
      out.ZoutMin = Math.min(...Zcorners);
      out.ZoutMax = Math.max(...Zcorners);

      // Vth/Rth ranges
      const VthC = cornersOf([R1, R2], (a, b) => (a + b) > 0 ? voltage * (b / (a + b)) : 0);
      const RthC = cornersOf([R1, R2], (a, b) => (a + b) > 0 ? (a * b) / (a + b) : 0);
      out.Vth = Vth; out.VthMin = Math.min(...VthC); out.VthMax = Math.max(...VthC);
      out.Rth = Rth; out.RthMin = Math.min(...RthC); out.RthMax = Math.max(...RthC);

      // Load error dV = Vth - Vout
      out.dV = Vth - out.Result;
      const dVcorners = cornersOf([R1, R2], (a, b) => {
        const vth = (a + b) > 0 ? voltage * (b / (a + b)) : 0;
        const vout = voutWith(a, b);
        return vth - vout;
      });
      out.dVMin = Math.min(...dVcorners);
      out.dVMax = Math.max(...dVcorners);

      // Power on R1, R2
      const pR1 = (r1: number, vout: number) => {
        const i1 = r1 > 0 ? (voltage - vout) / r1 : 0;
        return i1 * i1 * r1;
      };
      const pR2 = (r2: number, vout: number) => {
        const i2 = r2 > 0 ? vout / r2 : 0;
        return i2 * i2 * r2;
      };
      out.PR1 = pR1(R1, out.Result);
      out.PR2 = pR2(R2, out.Result);
      const PR1C = cornersOf([R1, R2], (a, b) => pR1(a, voutWith(a, b)));
      const PR2C = cornersOf([R1, R2], (a, b) => pR2(b, voutWith(a, b)));
      out.PR1Min = Math.min(...PR1C); out.PR1Max = Math.max(...PR1C);
      out.PR2Min = Math.min(...PR2C); out.PR2Max = Math.max(...PR2C);
    }

    if (rlcSolveFor === 'C') {
      const C1 = val1; const C2 = val2;
      const Xc = (C: number) => (w > 0 && C > 0) ? 1 / (w * C) : Infinity;

      const compute = (c1: number, c2: number) => {
        const x1 = Xc(c1), x2 = Xc(c2);
        if (!isFinite(x1) || !isFinite(x2)) return { v: 0, k: 0, I: 0, zout: 0, x1, x2 };
        // Load handling (resistive only)
        if (!(loadMode === 'R' && rload > 0)) {
          const v = voltage * (x2 / (x1 + x2));
          const I = (x1 + x2) > 0 ? voltage / (x1 + x2) : 0; // magnitude of chain current
          const zout = (x1 * x2) / (x1 + x2); // |Zout| = |Z1||Z2|/|Z1+Z2|, here both imaginary of same sign
          return { v, k: voltage > 0 ? v / voltage : 0, I, zout, x1, x2 };
        }
        // With Rload: complex math
        const R = rload;
        const D = R * R + x2 * x2;
        const re2 = (R * x2 * x2) / D;
        const im2 = -(R * R * x2) / D; // Z2' = re2 + j im2
        const reSum = re2; // Z1 is -j x1
        const imSum = im2 - x1;
        const magZ2p = Math.hypot(re2, im2);
        const magSum = Math.hypot(reSum, imSum);
        const v = magSum > 0 ? voltage * (magZ2p / magSum) : 0;
        const I = magSum > 0 ? voltage / magSum : 0;
        // Zout (Thevenin, no-load): || of pure reactances
        const zout = (x1 * x2) / (x1 + x2);
        return { v, k: voltage > 0 ? v / voltage : 0, I, zout, x1, x2 };
      };

      const cur = compute(C1, C2);
      out.Result = cur.v; out.k = cur.k; out.I = cur.I; out.Zout = cur.zout;
      out.X1 = cur.x1; out.X2 = cur.x2;

      const cs = cornersOf([C1, C2], (a, b) => compute(a, b));
      out.ResultMin = Math.min(...cs.map(o => o.v));
      out.ResultMax = Math.max(...cs.map(o => o.v));
      out.kMin = Math.min(...cs.map(o => o.k));
      out.kMax = Math.max(...cs.map(o => o.k));
      out.IMin = Math.min(...cs.map(o => o.I));
      out.IMax = Math.max(...cs.map(o => o.I));
      out.ZoutMin = Math.min(...cs.map(o => o.zout));
      out.ZoutMax = Math.max(...cs.map(o => o.zout));
      out.X1Min = Math.min(...cs.map(o => o.x1));
      out.X1Max = Math.max(...cs.map(o => o.x1));
      out.X2Min = Math.min(...cs.map(o => o.x2));
      out.X2Max = Math.max(...cs.map(o => o.x2));
    }

    if (rlcSolveFor === 'L') {
      const L1 = val1; const L2 = val2;
      const Xl = (L: number) => (w > 0 && L > 0) ? w * L : 0;

      const compute = (l1: number, l2: number) => {
        const x1 = Xl(l1), x2 = Xl(l2);
        if ((x1 + x2) <= 0) return { v: 0, k: 0, I: 0, zout: 0, x1, x2 };
        if (!(loadMode === 'R' && rload > 0)) {
          const v = voltage * (x2 / (x1 + x2));
          const I = voltage / (x1 + x2);
          const zout = (x1 * x2) / (x1 + x2);
          return { v, k: voltage > 0 ? v / voltage : 0, I, zout, x1, x2 };
        }
        const R = rload;
        const D = R * R + x2 * x2;
        const re2 = (R * x2 * x2) / D;
        const im2 = (R * R * x2) / D; // Z2' = re2 + j im2
        const reSum = re2; // Z1 is +j x1
        const imSum = im2 + x1;
        const magZ2p = Math.hypot(re2, im2);
        const magSum = Math.hypot(reSum, imSum);
        const v = magSum > 0 ? voltage * (magZ2p / magSum) : 0;
        const I = magSum > 0 ? voltage / magSum : 0;
        const zout = (x1 * x2) / (x1 + x2);
        return { v, k: voltage > 0 ? v / voltage : 0, I, zout, x1, x2 };
      };

      const cur = compute(L1, L2);
      out.Result = cur.v; out.k = cur.k; out.I = cur.I; out.Zout = cur.zout;
      out.X1 = cur.x1; out.X2 = cur.x2;

      const cs = cornersOf([L1, L2], (a, b) => compute(a, b));
      out.ResultMin = Math.min(...cs.map(o => o.v));
      out.ResultMax = Math.max(...cs.map(o => o.v));
      out.kMin = Math.min(...cs.map(o => o.k));
      out.kMax = Math.max(...cs.map(o => o.k));
      out.IMin = Math.min(...cs.map(o => o.I));
      out.IMax = Math.max(...cs.map(o => o.I));
      out.ZoutMin = Math.min(...cs.map(o => o.zout));
      out.ZoutMax = Math.max(...cs.map(o => o.zout));
      out.X1Min = Math.min(...cs.map(o => o.x1));
      out.X1Max = Math.max(...cs.map(o => o.x1));
      out.X2Min = Math.min(...cs.map(o => o.x2));
      out.X2Max = Math.max(...cs.map(o => o.x2));
    }

    return out;
  }, [rlcSolveFor, Voltage, Value1, Value2, Tol1, Tol2, Freq, loadMode, Rload, Iload]);

  return (
    <div class="grid cols-2">
      <div class="flex flex-col gap-2">
        <div class="grid cols-2">
          <Select
            label="Solve for"
            value={rlcSolveFor}
            onChange={(v) => setRlcSolveFor(v as Solver)}
            options={[
              { label: 'Resistors', value: 'R' },
              { label: 'Inductors', value: 'L' },
              { label: 'Capacitors', value: 'C' },
            ]}
          />
          {rlcSolveFor === 'R' && (
            <Select
              label="Load type"
              value={loadMode}
              onChange={(v) => setLoadMode(v as 'none' | 'R' | 'I')}
              options={[
                { label: 'None', value: 'none' },
                { label: 'R load', value: 'R' },
                { label: 'I load', value: 'I' },
              ]}
            />
          )}
        </div>
        <div class="grid cols-2">
          <Input
            label={<>{rlcSolveFor}<sub>1</sub></>}
            value={Value1}
            onChange={setValue_1}
            placeholder={rlcSolveFor === 'R' ? resistancePlaceholder : (rlcSolveFor === 'C' ? capacitancePlaceholder : inductancePlaceholder)}
            suffix={suffixMap[rlcSolveFor]}
            tolerance={Tol1}
            onToleranceChange={setTol1}
          />
          <Input
            label={<>{rlcSolveFor}<sub>2</sub></>}
            value={Value2}
            onChange={setValue_2}
            placeholder={rlcSolveFor === 'R' ? resistancePlaceholder : (rlcSolveFor === 'C' ? capacitancePlaceholder : inductancePlaceholder)}
            suffix={suffixMap[rlcSolveFor]}
            tolerance={Tol2}
            onToleranceChange={setTol2}
          />
        </div>
        <div class="grid cols-2">
          <Input
            label="Voltage"
            value={Voltage}
            onChange={setVoltage}
            placeholder={voltagePlaceholder}
            suffix={rlcSolveFor === 'R' ? '⎓V' : '⏦V'}
          />
          {rlcSolveFor !== 'R' && (
            <Input
              label="Frequency"
              value={Freq}
              onChange={setFreq}
              placeholder={frequencyPlaceholder}
              suffix="Hz"
            />
          )}
          {loadMode === 'R' && (
            <Input
              label="Load resistance"
              value={Rload}
              onChange={setRload}
              placeholder={resistancePlaceholder}
              suffix="Ω"
            />
          )}
          {loadMode === 'I' && rlcSolveFor === 'R' && (
            <Input
              label="Load current"
              value={Iload}
              onChange={setIload}
              placeholder={currentPlaceholder}
              suffix="A"
            />
          )}
        </div>
      </div>

      <ResultCard rows={[
        // Common
        { label: <>V<sub>out</sub></>, value: formatSI(solved.Result, 'V'), value_min: formatSI(solved.ResultMin ?? 0), value_max: formatSI(solved.ResultMax ?? 0) },
        { label: <>V<sub>out</sub>/V<sub>in</sub></>, value: `${(solved.k * 100).toFixed(2)} %`, value_min: `${(solved.kMin * 100).toFixed(2)}`, value_max: `${(solved.kMax * 100).toFixed(2)}` },
        ...(rlcSolveFor === 'R' ? [
          { label: 'Chain current', value: formatSI(solved.I, 'A'), value_min: formatSI(solved.IMin), value_max: formatSI(solved.IMax) },
        ] : []),

        // R-only extras (show Vth/Rth/ΔV only when load is present)
        ...(rlcSolveFor === 'R' && loadMode !== 'none' ? [
          { label: <>V<sub>th</sub></>, value: formatSI(solved.Vth, 'V'), value_min: formatSI(solved.VthMin), value_max: formatSI(solved.VthMax) },
          { label: <>R<sub>th</sub></>, value: formatSI(solved.Rth, 'Ω'), value_min: formatSI(solved.RthMin), value_max: formatSI(solved.RthMax) },
          { label: 'ΔV (load error)', value: formatSI(solved.dV, 'V'), value_min: formatSI(solved.dVMin), value_max: formatSI(solved.dVMax) },
        ] : []),
        ...(rlcSolveFor === 'R' ? [
          { label: <>P<sub>R<sub>1</sub></sub></>, value: formatSI(solved.PR1, 'W'), value_min: formatSI(solved.PR1Min), value_max: formatSI(solved.PR1Max) },
          { label: <>P<sub>R<sub>2</sub></sub></>, value: formatSI(solved.PR2, 'W'), value_min: formatSI(solved.PR2Min), value_max: formatSI(solved.PR2Max) },
        ] : []),

        // C-only extras
        ...(rlcSolveFor === 'C' ? [
          { label: <>X<sub>C<sub>1</sub></sub></>, value: formatSI(solved.X1, 'Ω'), value_min: formatSI(solved.X1Min), value_max: formatSI(solved.X1Max) },
          { label: <>X<sub>C<sub>2</sub></sub></>, value: formatSI(solved.X2, 'Ω'), value_min: formatSI(solved.X2Min), value_max: formatSI(solved.X2Max) },
        ] : []),

        // L-only extras
        ...(rlcSolveFor === 'L' ? [
          { label: <>X<sub>L<sub>1</sub></sub></>, value: formatSI(solved.X1, 'Ω'), value_min: formatSI(solved.X1Min, 'Ω'), value_max: formatSI(solved.X1Max, 'Ω') },
          { label: <>X<sub>L<sub>2</sub></sub></>, value: formatSI(solved.X2, 'Ω'), value_min: formatSI(solved.X2Min, 'Ω'), value_max: formatSI(solved.X2Max, 'Ω') },
        ] : []),
      ]} />
    </div>
  );
}