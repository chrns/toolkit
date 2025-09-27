import { parseSI, formatSI } from "@/lib/si";
import { kelvinShift } from "@/lib/units";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { useMemo, useState } from "preact/hooks";
import { resistancePlaceholder, temperaturePlaceholder, voltagePlaceholder } from "../../shared";
import { RadioGroup } from "@/ui/components/RadioGroup";

function exp(x: number) { return Math.exp(x); }
function clamp(n: number, min: number, max: number) { return Math.min(Math.max(n, min), max); }

function steinhartSolveRFromT(Tc: number, A: number, B: number, C: number, R0Guess: number): number {
  const Tk = Tc + kelvinShift;
  if (Tk <= 0) return NaN;
  const y = 1 / Tk;

  let x = Math.log(clamp(R0Guess, 1, 1e9)); // initial guess
  const f = (xx: number) => A + B * xx + C * xx * xx * xx - y;
  const df = (xx: number) => B + 3 * C * xx * xx;

  // Try a few Newton steps
  for (let i = 0; i < 20; i++) {
    const fx = f(x);
    const dfx = df(x);
    if (!isFinite(fx) || !isFinite(dfx) || Math.abs(dfx) < 1e-18) break;
    const step = fx / dfx;
    x -= step;
    if (Math.abs(step) < 1e-12) break;
  }

  let R = Math.exp(x);
  if (isFinite(R) && R > 0) return R;

  let lo = Math.log(1);
  let hi = Math.log(1e9);
  let flo = f(lo);
  let fhi = f(hi);
  if (flo * fhi > 0) return NaN;
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-15) { x = mid; break; }
    if (flo * fmid <= 0) { hi = mid; fhi = fmid; } else { lo = mid; flo = fmid; }
    x = mid;
  }
  R = Math.exp(x);
  return isFinite(R) ? R : NaN;
}

function steinhartTempFromR(R: number, A: number, B: number, C: number): number {
  if (!(R > 0)) return NaN;
  const x = Math.log(R);
  const invT = A + B * x + C * x * x * x;
  if (invT <= 0) return NaN;
  return 1 / invT - kelvinShift;
}

export function NTCTab() {
  type Model = 'beta' | 'steinhart';
  const [model, setModel] = useState<Model>('beta');

  // Beta model inputs
  const [RCalib, setRCalib] = useState('10k');
  const [TCalib, setTCalib] = useState('25');
  const [Beta, setBeta] = useState('4000');

  // Steinhart–Hart inputs
  const [Acoef, setAcoef] = useState('1.129148e-3');
  const [Bcoef, setBcoef] = useState('2.34125e-4');
  const [Ccoef, setCcoef] = useState('8.76741e-8');

  // Common/tolerance
  const [tolerance, setTolerance] = useState<number>(1);
  const [toleranceRef, setToleranceRef] = useState<number>(1);
  const [TTarget, setTTarget] = useState('75');
  const [Vsup, setVsup] = useState('3.3');
  const [Rref, setRref] = useState('10k');
  const [Rmeas, setRmeas] = useState('');
  const [AdcBits, setAdcBits] = useState<number>(12);
  const [VrefAdc, setVrefAdc] = useState<string>('3.3');

  // Parsed values
  const R0 = parseSI(RCalib) ?? 0;
  const T0 = parseSI(TCalib) ?? 0;
  const Bval = parseSI(Beta) ?? 0;
  const A = parseSI(Acoef) ?? 0;
  const B = parseSI(Bcoef) ?? 0;
  const C = parseSI(Ccoef) ?? 0;
  const Tol = tolerance;
  const TTar = parseSI(TTarget) ?? 0;
  const Vs = parseSI(Vsup) ?? 0;
  const Rfix = parseSI(Rref) ?? 0;
  const tolRef = Math.max(0, toleranceRef) / 100;
  const RrefMin = Rfix * (1 - tolRef);
  const RrefMax = Rfix * (1 + tolRef);
  const Rm = parseSI(Rmeas) ?? NaN;
  const Nbits = Math.max(1, Math.floor(AdcBits));
  const Vref = parseSI(VrefAdc) ?? 0;

  const TypicalR = useMemo(() => {
    if (model === 'beta') {
      const Tk = TTar + kelvinShift;
      const T0k = T0 + kelvinShift;
      if (!(R0 > 0 && Bval > 0 && Tk > 0 && T0k > 0)) return NaN;
      return R0 * exp(Bval * (1 / Tk - 1 / T0k));
    } else {
      const guess = (R0 > 0 && Bval > 0)
        ? (R0 * exp(Bval * (1 / (TTar + kelvinShift) - 1 / (T0 + kelvinShift))))
        : (parseSI('10k') || 10000);
      return steinhartSolveRFromT(TTar, A, B, C, Math.max(1, guess));
    }
  }, [model, R0, T0, Bval, TTar, A, B, C]);

  const MinR = (1 - Tol / 100) * (isFinite(TypicalR) ? TypicalR : 0);
  const MaxR = (1 + Tol / 100) * (isFinite(TypicalR) ? TypicalR : 0);

  // Delta R relative to calibration point
  const DeltaR = isFinite(TypicalR) ? TypicalR - R0 : NaN;

  // dR/dT and TCR
  const dRdT = useMemo(() => {
    const Tk = TTar + kelvinShift;
    if (!isFinite(TypicalR) || !(Tk > 0)) return NaN;
    if (model === 'beta') {
      // dR/dT = (-B/T^2) * R
      return (-Bval / (Tk * Tk)) * TypicalR;
    } else {
      // From 1/T = A + B ln R + C (ln R)^3 -> dR/dT = ( -R / T^2 ) / ( B + 3C (ln R)^2 )
      const x = Math.log(TypicalR);
      const denom = B + 3 * C * x * x;
      if (Math.abs(denom) < 1e-24) return NaN;
      return (-TypicalR / (Tk * Tk)) / denom;
    }
  }, [model, TypicalR, TTar, Bval, A, B, C]);

  const TCR = isFinite(dRdT) && isFinite(TypicalR) && TypicalR !== 0 ? (dRdT / TypicalR) * 100 : NaN; // %/K ≈ %/°C

  // Divider (pull-up to Vs, NTC to GND)
  const Vout = (Rfix > 0 && isFinite(TypicalR)) ? (Vs * TypicalR / (Rfix + TypicalR)) : 0;
  const Pntc = (isFinite(TypicalR) && TypicalR > 0) ? (Vout * Vout) / TypicalR : 0; // power dissipated by NTC in divider

  // Ranges with tolerances
  const VoutMin = (Vs > 0) ? (Vs * MinR / (RrefMax + MinR)) : 0;
  const VoutMax = (Vs > 0) ? (Vs * MaxR / (RrefMin + MaxR)) : 0;
  const PntcMin = (MinR > 0) ? (VoutMin * VoutMin) / MinR : 0;
  const PntcMax = (MaxR > 0) ? (VoutMax * VoutMax) / MaxR : 0;

  // ADC code calculations
  const fullScale = Math.max(1, Math.round(Math.pow(2, Nbits) - 1));
  const ratio = (Vref > 0) ? clamp(Vout / Vref, 0, 1) : NaN;
  const AdcCode = Number.isFinite(ratio) ? Math.round(ratio * fullScale) : NaN;

  const ratioMin = (Vref > 0) ? clamp(VoutMin / Vref, 0, 1) : NaN;
  const ratioMax = (Vref > 0) ? clamp(VoutMax / Vref, 0, 1) : NaN;
  const AdcCodeMin = Number.isFinite(ratioMin) ? Math.round(ratioMin * fullScale) : NaN;
  const AdcCodeMax = Number.isFinite(ratioMax) ? Math.round(ratioMax * fullScale) : NaN;

  // Inverse: temperature from a measured resistance
  const TfromR = useMemo(() => {
    if (!(Rm > 0)) return NaN;
    if (model === 'beta') {
      if (!(R0 > 0 && Bval > 0)) return NaN;
      const invTk = 1 / (T0 + kelvinShift) + (1 / Bval) * Math.log(Rm / R0);
      return 1 / invTk - kelvinShift;
    } else {
      return steinhartTempFromR(Rm, A, B, C);
    }
  }, [model, Rm, R0, Bval, T0, A, B, C]);

  return (
    <div class="grid cols-2">
      <div class="grid">
        <RadioGroup
          label="Formula type"
          value={model}
          onChange={(v: string) => setModel((v as 'beta' | 'steinhart'))}
          options={[
            { label: 'Beta', value: 'beta' },
            { label: 'Steinhart-Hart', value: 'steinhart' },
          ]}
        />

        {model === 'beta' ? (
          <>
            <Input
              label="Calibration resistance"
              value={RCalib}
              onChange={setRCalib}
              suffix="Ω"
              tolerance={tolerance}
              onToleranceChange={setTolerance}
              placeholder={resistancePlaceholder}
            />
            <Input
              label="Calibration temperature"
              value={TCalib}
              onChange={setTCalib}
              suffix="°C"
              placeholder={temperaturePlaceholder}
            />
            <Input
              label="Thermistor beta"
              value={Beta}
              onChange={setBeta}
              suffix="K"
              placeholder="4000"
            />
          </>
        ) : (
          <>
            <Input
              label="Steinhart-Hart A"
              value={Acoef}
              onChange={setAcoef}
              suffix=""
              placeholder="~1.129e-3"
            />
            <Input
              label="Steinhart-Hart B"
              value={Bcoef}
              onChange={setBcoef}
              suffix=""
              placeholder="~2.34e-4"
            />
            <Input
              label="Steinhart-Hart C"
              value={Ccoef}
              onChange={setCcoef}
              suffix=""
              placeholder="~8.77e-8"
            />
            <Input
              label="Thermistor tolerance"
              value={String(tolerance)}
              onChange={(v) => setTolerance(Number(v) || 0)}
              suffix="%"
              placeholder="1"
            />
          </>
        )}

        <Input
          label="Target temperature"
          value={TTarget}
          onChange={setTTarget}
          suffix="°C"
          placeholder={temperaturePlaceholder}
        />

        <Input
          label="Supply voltage"
          value={Vsup}
          onChange={setVsup}
          suffix="V"
          placeholder={voltagePlaceholder}
        />
        <Input
          label="Reference resistor (pull-up)"
          value={Rref}
          onChange={setRref}
          suffix="Ω"
          tolerance={toleranceRef}
          onToleranceChange={setToleranceRef}
          placeholder={resistancePlaceholder}
        />
        <div class="grid cols-2">
          <Input
            label="ADC resolution"
            value={String(AdcBits)}
            onChange={(v) => setAdcBits(Number(v) || 0)}
            suffix="bits"
            placeholder="12"
          />
          <Input
            label="ADC reference"
            value={VrefAdc}
            onChange={setVrefAdc}
            suffix="V"
            placeholder="= Vsup if ratiometric"
          />
        </div>
        <Input
          label="Measured resistance"
          value={Rmeas}
          onChange={setRmeas}
          suffix="Ω"
          placeholder='Compute T from measured R'
        />
      </div>

      <ResultCard rows={[
        { label: 'Model', value: model === 'beta' ? 'Beta' : 'Steinhart-Hart' },
        { label: 'Resistance at target', value: isFinite(TypicalR) ? `${formatSI(TypicalR, 'Ω')}` : '—', value_min: `${formatSI(MinR, '')}`, value_max: `${formatSI(MaxR, '')}` },
        { label: 'ΔR from calibration', value: isFinite(DeltaR) ? `${formatSI(DeltaR, 'Ω')}` : '—' },
        { label: 'dR/dT at target', value: isFinite(dRdT) ? `${formatSI(dRdT, 'Ω/°C')}` : '—' },
        { label: 'TCR at target', value: isFinite(TCR) ? `${TCR.toFixed(3)} %/°C` : '—' },
        { label: 'Divider output (Vout)', value: `${formatSI(Vout, 'V')}`, value_min: `${formatSI(VoutMin, 'V')}`, value_max: `${formatSI(VoutMax, 'V')}` },
        { label: 'NTC power in divider', value: `${formatSI(Pntc, 'W')}`, value_min: `${formatSI(PntcMin, 'W')}`, value_max: `${formatSI(PntcMax, 'W')}` },
        { label: <>ADC @ V<sub>ref</sub></>, value: Number.isFinite(AdcCode) ? `${AdcCode} / ${(fullScale)} (${(ratio * 100).toFixed(2)}%)` : '—', value_min: Number.isFinite(AdcCodeMin) ? String(AdcCodeMin) : undefined, value_max: Number.isFinite(AdcCodeMax) ? String(AdcCodeMax) : undefined },
        { label: 'Temperature from measured R', value: isFinite(TfromR) ? `${TfromR.toFixed(2)} °C` : '—' },
      ]} />
    </div>
  );
}