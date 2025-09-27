import { parseSI, formatSI } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { LEDSelect } from "@/ui/components/LEDSelect";
import { ResultCard } from "@/ui/components/ResultCard";
import { PinIcon } from "@/ui/icons/PinIcon";
import { useState, useMemo } from "preact/hooks";
import {
  defaultToleranceR, defaultResistance, defaultVoltage, defaultCurrent,
  resistancePlaceholder, voltagePlaceholder, currentPlaceholder, defaultForwardVoltage, SolveRVI
} from '../../shared';

export function LedTab() {
  const [voltage, setVoltage] = useState(defaultVoltage);
  const [current, setCurrent] = useState(defaultCurrent);
  const [resistance, setResistance] = useState(defaultResistance);
  const [toleranceR, setToleranceR] = useState<number>(defaultToleranceR);
  const [voltageDrop, setVoltageDrop] = useState(defaultForwardVoltage);

  const [solveFor, setSolveFor] = useState<SolveRVI>('R');

  const makeOnChange = (name: SolveRVI, setter: (v: string) => void) => (v: string) => {
    if (name === 'V') { setter(v); return; }
    if (solveFor !== name) return;
    setter(v);
  };

  const toggleSolve = (name: SolveRVI) => {
    if (name === solveFor) return; // nothing to do
    setSolveFor(name);
  };

  const solved = useMemo(() => {
    // Read raw values
    const VsupRaw = parseSI(voltage);
    const VdropRaw = parseSI(voltageDrop);
    const Rraw = parseSI(resistance);
    const Iraw = parseSI(current);
    // normalize values
    const Vsup = (typeof VsupRaw === 'number' && isFinite(VsupRaw)) ? VsupRaw : NaN;
    const Vd = (typeof VdropRaw === 'number' && isFinite(VdropRaw)) ? VdropRaw : 0;
    const Rn = (typeof Rraw === 'number' && isFinite(Rraw) && Rraw > 0) ? Rraw : NaN;
    const In = (typeof Iraw === 'number' && isFinite(Iraw)) ? Iraw : NaN;
    const Vr = Math.max(0, (isNaN(Vsup) ? 0 : Vsup) - (isNaN(Vd) ? 0 : Vd));

    let R = [0, Rn, 0], I = [0, In, 0];
    const tol = Math.max(0, toleranceR) / 100;
    switch (solveFor) {
      case "R": // I = Vr / R
        if (!isNaN(Vr) && Vr >= 0 && !isNaN(Rn) && Rn !== 0) {
          R[0] = Rn * (1 - tol); R[2] = Rn * (1 + tol);
          I.forEach((_, i) => I[i] = Vr / R[i]);
        }
        break;
      case "I": // R = Vr / I
        if (!isNaN(Vr) && Vr >= 0 && !isNaN(In) && In !== 0) {
          R[1] = Vr / In; R[0] = R[1] * (1 - tol); R[2] = R[1] * (1 + tol);
        }
        break;
      default:
        break;
    }

    // calculating power & efficiency
    let Pres = [0, 0, 0], Pled = [0, 0, 0], Ptot = [0, 0, 0], eta = [0, 0, 0];

    if (solveFor === 'I' && isFinite(In)) {
      I = [In, In, In];
    }

    for (let i = 0; i < 3; i++) {
      const Ii = (typeof I[i] === 'number' && isFinite(I[i])) ? I[i] : 0;
      const Ri = (typeof R[i] === 'number' && isFinite(R[i])) ? R[i] : 0;

      Pres[i] = Ii * Ii * Ri;
      Ptot[i] = Ii * Vsup;
      Pled[i] = Ii * Vd;
      eta[i] = Ptot[i] ? (Pled[i] / Ptot[i]) : 0;
    }

    const safeArray = (arr: number[]) =>
      arr.map(x => (typeof x === 'number' && isFinite(x)) ? x : 0);

    return {
      R: safeArray(R), I: safeArray(I), Pres: safeArray(Pres), Pled: safeArray(Pled), Ptot: safeArray(Ptot), eta: safeArray(eta)
    };
  }, [resistance, voltage, current, voltageDrop, solveFor, toleranceR]);


  return (
    <div class="grid cols-2">
      <div class="flex flex-col gap-3">
        <Input
          label="Voltage" value={voltage} suffix="V" placeholder={voltagePlaceholder}
          onChange={makeOnChange('V', setVoltage)}
        />
        <Input
          label="Resistance" value={resistance} suffix="Ω" placeholder={resistancePlaceholder}
          onChange={makeOnChange('R', setResistance)}
          tolerance={toleranceR} onToleranceChange={setToleranceR}
          isFixed={solveFor !== 'R'} fixedContent={<PinIcon />}
          onToggleFix={() => toggleSolve('R')}
        />
        <Input
          label="Current" value={current} suffix="A" placeholder={currentPlaceholder}
          onChange={makeOnChange('I', setCurrent)}
          isFixed={solveFor !== 'I'} fixedContent={<PinIcon />}
          onToggleFix={() => toggleSolve('I')}
        />
        <LEDSelect value={voltageDrop} setValue={setVoltageDrop} />
        <Input
          label="Voltage drop" value={voltageDrop} suffix="V" placeholder={voltagePlaceholder}
          onChange={makeOnChange('V', setVoltageDrop)}
        />
      </div>
      <ResultCard rows={[
        { label: 'Resistor', value: formatSI(solved.R[1], 'Ω'), value_min: formatSI(solved.R[0]), value_max: formatSI(solved.R[2]), },
        { label: 'LED Current', value: formatSI(solved.I[1], 'A'), value_min: formatSI(solved.I[0]), value_max: formatSI(solved.I[2]) },
        { label: 'Resistor Power', value: formatSI(solved.Pres[1], 'W'), value_min: formatSI(solved.Pres[0]), value_max: formatSI(solved.Pres[2]) },
        { label: 'LED Power', value: formatSI(solved.Pled[1], 'W'), value_min: formatSI(solved.Pled[0]), value_max: formatSI(solved.Pled[2]) },
        { label: 'Total Power', value: formatSI(solved.Ptot[1], 'W'), value_min: formatSI(solved.Ptot[0]), value_max: formatSI(solved.Ptot[2]) },
        { label: 'Efficiency', value: `${(solved.eta[1] * 100).toFixed(1)} %`, value_min: `${(solved.eta[0] * 100).toFixed(1)} %`, value_max: `${(solved.eta[2] * 100).toFixed(1)} %` },
      ]} />
    </div>
  );
}