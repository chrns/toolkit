import { parseSI, formatSI } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { QuestionMarkIcon } from "@/ui/icons/QuesionMarkIcon";
import { useState, useEffect, useMemo } from "preact/hooks";
import {
  defaultToleranceR, defaultResistance, defaultVoltage, defaultCurrent,
  resistancePlaceholder, voltagePlaceholder, currentPlaceholder, SolveRVI
} from '../../shared';

export function OhmsLawTab() {
  const [resistance, setResistance] = useState(defaultResistance);
  const [voltage, setVoltage] = useState(defaultVoltage);
  const [current, setCurrent] = useState(defaultCurrent);
  const [toleranceR, setToleranceR] = useState<number>(defaultToleranceR);
  const [solveFor, setSolveFor] = useState<SolveRVI>('I');

  // backups for values
  const [prevR, setPrevR] = useState<string>(defaultResistance);
  const [prevV, setPrevV] = useState<string>(defaultVoltage);
  const [prevI, setPrevI] = useState<string>(defaultCurrent);

  // default lock is current (I)
  useEffect(() => {
    setPrevI(current);
    setCurrent("");
  }, []);

  // Update value unless this field is the locked one; keep a backup of the last non-empty value
  const makeOnChange = (name: SolveRVI, setter: (v: string) => void) => (v: string) => {
    if (solveFor === name) return; // block edits for the locked (solved) field

    // always update the field so useMemo recalculates
    setter(v);

    // don't overwrite backup with empty typing; keep last meaningful value
    if ((v ?? '').trim() !== '') {
      if (name === 'R') setPrevR(v);
      if (name === 'V') setPrevV(v);
      if (name === 'I') setPrevI(v);
    }
  };

  const toggleSolve = (name: SolveRVI) => {
    if (name === solveFor) return; // nothing to do

    // restore value of the field that was locked before
    switch (solveFor) {
      case 'R': setResistance(prevR ?? ''); break;
      case 'V': setVoltage(prevV ?? ''); break;
      case 'I': setCurrent(prevI ?? ''); break;
    }

    // save current value of the new field to backup (only if non-empty), then clear it
    if (name === 'R') { if ((resistance ?? '').trim() !== '') setPrevR(resistance); setResistance(''); }
    if (name === 'V') { if ((voltage ?? '').trim() !== '') setPrevV(voltage); setVoltage(''); }
    if (name === 'I') { if ((current ?? '').trim() !== '') setPrevI(current); setCurrent(''); }

    setSolveFor(name);
  };

  const solved = useMemo(() => {
    // read raw values
    const Rraw = parseSI(resistance), Vraw = parseSI(voltage), Iraw = parseSI(current);
    // normalize values
    const Rn = (typeof Rraw === 'number' && isFinite(Rraw) && Rraw > 0) ? Rraw : NaN;
    const Vn = (typeof Vraw === 'number' && isFinite(Vraw)) ? Vraw : NaN;
    const In = (typeof Iraw === 'number' && isFinite(Iraw)) ? Iraw : NaN;

    let R = [0, Rn, 0], V = [0, Vn, 0], I = [0, In, 0], P = [0, 0, 0];
    const tol = Math.max(0, toleranceR) / 100;

    switch (solveFor) {
      case "R": // V & I given => R = V/I
        R[1] = Vn / In; V[1] = Vn; I[1] = In; P[1] = Vn * In;
        break;
      case "V": // I & R given => V = I*R
        R[0] = Rn * (1 - tol); R[2] = Rn * (1 + tol);
        V.forEach((_, i) => V[i] = In * R[i]);
        I.forEach((_, i) => I[i] = In);
        P.forEach((_, i) => P[i] = In * In * R[i]);
        break;
      case "I": // V & R given => I = V/R
        R[0] = Rn * (1 - tol); R[2] = Rn * (1 + tol);
        I.forEach((_, i) => I[i] = Vn / R[i]);
        V.forEach((_, i) => V[i] = Vn); // fixed value
        P.forEach((_, i) => P[i] = Vn * Vn / R[i]);
        break;
    }

    const safeArray = (arr: number[]) =>
      arr.map(x => (typeof x === 'number' && isFinite(x)) ? x : 0);

    return {
      R: safeArray(R), V: safeArray(V), I: safeArray(I), P: safeArray(P),
    };
  }, [resistance, voltage, current, solveFor, toleranceR]);

  const { R, V, I, P } = solved;

  return (
    <div class="grid cols-2">
      <div class="grid cols-1">
        <Input
          label="Resistance" value={resistance} suffix="Ω" placeholder={resistancePlaceholder}
          tolerance={toleranceR} onToleranceChange={setToleranceR}
          onChange={makeOnChange('R', setResistance)}
          isFixed={solveFor === 'R'} fixedContent={<QuestionMarkIcon />}
          onToggleFix={() => toggleSolve('R')}
        />
        <Input
          label="Voltage" value={voltage} suffix="V" placeholder={voltagePlaceholder}
          onChange={makeOnChange('V', setVoltage)}
          isFixed={solveFor === 'V'} fixedContent={<QuestionMarkIcon />}
          onToggleFix={() => toggleSolve('V')}
        />
        <Input
          label="Current" value={current} suffix="A" placeholder={currentPlaceholder}
          onChange={makeOnChange('I', setCurrent)}
          isFixed={solveFor === 'I'} fixedContent={<QuestionMarkIcon />}
          onToggleFix={() => toggleSolve('I')}
        />
      </div>

      <ResultCard rows={[
        solveFor === 'R'
          ? { label: 'Ohms', value: formatSI(R[1], 'Ω'), }
          : { label: 'Ohms', value: formatSI(R[1], 'Ω'), value_min: formatSI(R[0]), value_max: formatSI(solved.R[2]), },
        solveFor === 'I' || solveFor === 'V'
          ? { label: 'Volts', value: formatSI(V[1], 'V'), value_min: formatSI(V[0] ?? 0), value_max: formatSI(V[2] ?? 0) }
          : { label: 'Volts', value: formatSI(V[1], 'V') },
        solveFor === 'I' || solveFor === 'V'
          ? { label: 'Amps', value: formatSI(I[1], 'A'), value_min: formatSI(I[0] ?? 0), value_max: formatSI(I[2] ?? 0) }
          : { label: 'Amps', value: formatSI(I[1], 'A') },
        solveFor == 'R'
          ? { label: 'Power', value: formatSI(P[1], 'W') }
          : { label: 'Power', value: formatSI(P[1], 'W'), value_min: formatSI(P[0]), value_max: formatSI(P[2]) },
      ]} />
    </div>
  );
}