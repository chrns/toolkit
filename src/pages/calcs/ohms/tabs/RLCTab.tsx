import { parseSI, formatSI } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { Select } from "@/ui/components/Select";
import { useState, useMemo } from "preact/hooks";
import {
  defaultToleranceR, defaultVoltage, defaultCurrent,
  resistancePlaceholder,
  voltagePlaceholder,
  capacitancePlaceholder,
  inductancePlaceholder,
  currentPlaceholder,
  frequencyPlaceholder,
  defaultFrequency
} from '@/pages/calcs/shared';

export function RLCTab() {
  type Mode = 'Resistor' | 'Capacitor' | 'Inductor';
  const [mode, setMode] = useState<Mode>('Resistor');
  const [resTol, setResTol] = useState<number>(defaultToleranceR);
  const [capTol, setCapTol] = useState<number>(defaultToleranceR);
  const [indTol, setIndTol] = useState<number>(defaultToleranceR);
  const [resList, setResList] = useState('10k, 4k7');
  const [capList, setCapList] = useState('10n, 100n');
  const [indList, setIndList] = useState('10u, 47u');
  const [capVoltage, setCapVoltage] = useState(defaultVoltage);
  const [resVoltage, setResVoltage] = useState(defaultVoltage);
  const [indCurrent, setIndCurrent] = useState(defaultCurrent);
  const [capFreq, setCapFreq] = useState(defaultFrequency);
  const [indFreq, setIndFreq] = useState(defaultFrequency);

  // --- Resistor network (comma-separated list)
  const resistors = useMemo(() => resList
    .split(/[\,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(v => parseSI(v))
    .filter((x): x is number => typeof x === 'number' && isFinite(x) && x > 0), [resList]);

  const Vres = useMemo(() => parseSI(resVoltage) ?? 0, [resVoltage]);

  // Totals
  const Rser = useMemo(() => resistors.reduce((a, c) => a + c, 0), [resistors]);
  const Rpar = useMemo(() => {
    const d = resistors.reduce((a, c) => a + 1 / c, 0);
    return d > 0 ? 1 / d : 0;
  }, [resistors]);

  // Resistor totals with tolerances
  const resTolFrac = Math.max(0, resTol) / 100;
  const RserMin = useMemo(() => resistors.reduce((a, r) => a + r * (1 - resTolFrac), 0), [resistors, resTolFrac]);
  const RserMax = useMemo(() => resistors.reduce((a, r) => a + r * (1 + resTolFrac), 0), [resistors, resTolFrac]);
  const RparMin = useMemo(() => {
    const sumInv = resistors.reduce((a, r) => a + 1 / (r * (1 + resTolFrac)), 0);
    const sumInvMin = resistors.reduce((a, r) => a + 1 / (r * (1 - resTolFrac)), 0);
    return sumInvMin > 0 ? 1 / sumInvMin : 0; // min total (all R_i at min)
  }, [resistors, resTolFrac]);
  const RparMax = useMemo(() => {
    const sumInvMax = resistors.reduce((a, r) => a + 1 / (r * (1 + resTolFrac)), 0);
    return sumInvMax > 0 ? 1 / sumInvMax : 0;
  }, [resistors, resTolFrac]);

  // Per-resistor power arrays
  const Pser_each = useMemo(() => {
    const I = Rser > 0 ? Vres / Rser : 0;
    return resistors.map(r => I * I * r);
  }, [resistors, Vres, Rser]);

  const Ppar_each = useMemo(() => {
    return resistors.map(r => (Vres * Vres) / r);
  }, [resistors, Vres]);

  // Capacitor network (comma-separated list)
  const caps = useMemo(() => capList
    .split(/[\,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(v => parseSI(v))
    .filter((x): x is number => typeof x === 'number' && isFinite(x) && x > 0), [capList]);
  const capTolFrac = Math.max(0, capTol) / 100;
  const Cpar = useMemo(() => caps.reduce((a, c) => a + c, 0), [caps]);
  const CparMin = useMemo(() => caps.reduce((a, c) => a + c * (1 - capTolFrac), 0), [caps, capTolFrac]);
  const CparMax = useMemo(() => caps.reduce((a, c) => a + c * (1 + capTolFrac), 0), [caps, capTolFrac]);
  const Cser = useMemo(() => {
    const d = caps.reduce((a, c) => a + 1 / c, 0);
    return d > 0 ? 1 / d : 0;
  }, [caps]);
  const CserMin = useMemo(() => {
    const d = caps.reduce((a, c) => a + 1 / (c * (1 + capTolFrac)), 0);
    return d > 0 ? 1 / d : 0;
  }, [caps, capTolFrac]);
  const CserMax = useMemo(() => {
    const d = caps.reduce((a, c) => a + 1 / (c * (1 - capTolFrac)), 0);
    return d > 0 ? 1 / d : 0;
  }, [caps, capTolFrac]);
  const Vcap = useMemo(() => parseSI(capVoltage) ?? 0, [capVoltage]);
  const fCap = useMemo(() => Math.max(0, parseSI(capFreq) ?? 0), [capFreq]);
  const Xc_par = useMemo(() => (fCap > 0 && Cpar > 0) ? 1 / (2 * Math.PI * fCap * Cpar) : 0, [fCap, Cpar]);
  const Xc_ser = useMemo(() => (fCap > 0 && Cser > 0) ? 1 / (2 * Math.PI * fCap * Cser) : 0, [fCap, Cser]);
  const Epar = useMemo(() => 0.5 * Cpar * Vcap * Vcap, [Cpar, Vcap]);
  const Eser = useMemo(() => 0.5 * Cser * Vcap * Vcap, [Cser, Vcap]);

  // --- Inductor network (comma-separated list)
  const inducs = useMemo(() => indList
    .split(/[\,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(v => parseSI(v))
    .filter((x): x is number => typeof x === 'number' && isFinite(x) && x > 0), [indList]);
  const indTolFrac = Math.max(0, indTol) / 100;
  const Lser = useMemo(() => inducs.reduce((a, c) => a + c, 0), [inducs]);
  const LserMin = useMemo(() => inducs.reduce((a, c) => a + c * (1 - indTolFrac), 0), [inducs, indTolFrac]);
  const LserMax = useMemo(() => inducs.reduce((a, c) => a + c * (1 + indTolFrac), 0), [inducs, indTolFrac]);
  const Lpar = useMemo(() => {
    const d = inducs.reduce((a, c) => a + 1 / c, 0);
    return d > 0 ? 1 / d : 0;
  }, [inducs]);
  const LparMin = useMemo(() => {
    const d = inducs.reduce((a, c) => a + 1 / (c * (1 + indTolFrac)), 0);
    return d > 0 ? 1 / d : 0;
  }, [inducs, indTolFrac]);
  const LparMax = useMemo(() => {
    const d = inducs.reduce((a, c) => a + 1 / (c * (1 - indTolFrac)), 0);
    return d > 0 ? 1 / d : 0;
  }, [inducs, indTolFrac]);
  const Iind = useMemo(() => parseSI(indCurrent) ?? 0, [indCurrent]);
  const fInd = useMemo(() => Math.max(0, parseSI(indFreq) ?? 0), [indFreq]);
  const Xl_par = useMemo(() => (fInd > 0 && Lpar > 0) ? 2 * Math.PI * fInd * Lpar : 0, [fInd, Lpar]);
  const Xl_ser = useMemo(() => (fInd > 0 && Lser > 0) ? 2 * Math.PI * fInd * Lser : 0, [fInd, Lser]);
  const Wind_par = useMemo(() => (Iind * Iind * Lpar) / 2, [Iind, Lpar]);
  const Wind_ser = useMemo(() => (Iind * Iind * Lser) / 2, [Iind, Lser]);

  return (
    <div class="grid cols-2">
      <div class="flex flex-col gap-3">
        <Select
          label="Component type"
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { label: 'Resistor', value: 'Resistor' },
            { label: 'Capacitor', value: 'Capacitor' },
            { label: 'Inductor', value: 'Inductor' },
          ]}
        />

        {mode === 'Resistor' && (
          <>
            <Input
              label="Resistors (comma-separated)"
              value={resList}
              onChange={setResList}
              placeholder={resistancePlaceholder}
              suffix="Ω"
              tolerance={resTol}
              onToleranceChange={setResTol}
            />
            <Input
              label="Voltage"
              value={resVoltage}
              onChange={setResVoltage}
              placeholder={voltagePlaceholder}
              suffix="V"
            />
          </>
        )}

        {mode === 'Capacitor' && (
          <>
            <Input
              label="Capacitors (comma-separated)"
              value={capList}
              onChange={setCapList}
              placeholder={capacitancePlaceholder}
              suffix="F"
              tolerance={capTol}
              onToleranceChange={setCapTol}
            />
            <Input
              label="Voltage"
              value={capVoltage}
              onChange={setCapVoltage}
              suffix="V"
              placeholder={voltagePlaceholder}
            />
            <Input
              label="Frequency"
              value={capFreq}
              onChange={setCapFreq}
              suffix="Hz"
              placeholder={frequencyPlaceholder}
            />
          </>
        )}

        {mode === 'Inductor' && (
          <>
            <Input
              label="Inductors (comma-separated)"
              value={indList}
              onChange={setIndList}
              placeholder={inductancePlaceholder}
              suffix="H"
              tolerance={indTol}
              onToleranceChange={setIndTol}
            />
            <Input
              label="Current"
              value={indCurrent}
              onChange={setIndCurrent}
              suffix="A"
              placeholder={currentPlaceholder}
            />
            <Input
              label="Frequency"
              value={indFreq}
              onChange={setIndFreq}
              suffix="Hz"
              placeholder={frequencyPlaceholder}
            />
          </>
        )}
      </div>

      {mode === 'Resistor' && (
        <ResultCard rows={[
          { label: <>R<sub>par</sub></>, value: formatSI(Rpar, 'Ω'), value_min: formatSI(RparMin), value_max: formatSI(RparMax) },
          { label: <>P<sub>par</sub> (per R)</>, value: Ppar_each.map(p => formatSI(p, 'W')).join(', ') },
          { label: <>R<sub>ser</sub></>, value: formatSI(Rser, 'Ω'), value_min: formatSI(RserMin), value_max: formatSI(RserMax) },
          { label: <>P<sub>ser</sub> (per R)</>, value: Pser_each.map(p => formatSI(p, 'W')).join(', ') },
        ]} />
      )}

      {mode === 'Capacitor' && (
        <ResultCard rows={[
          { label: <>C<sub>par</sub></>, value: formatSI(Cpar, 'F'), value_min: formatSI(CparMin), value_max: formatSI(CparMax) },
          { label: <>W<sub>par</sub></>, value: formatSI(Epar, 'J') },
          { label: <>X<sub>c,par</sub></>, value: formatSI(Xc_par, 'Ω') },
          { label: <>C<sub>ser</sub></>, value: formatSI(Cser, 'F'), value_min: formatSI(CserMin), value_max: formatSI(CserMax) },
          { label: <>W<sub>ser</sub></>, value: formatSI(Eser, 'J') },
          { label: <>X<sub>c,ser</sub></>, value: formatSI(Xc_ser, 'Ω') },
        ]} />
      )}

      {mode === 'Inductor' && (
        <ResultCard rows={[
          { label: <>L<sub>par</sub></>, value: formatSI(Lpar, 'H'), value_min: formatSI(LparMin), value_max: formatSI(LparMax) },
          { label: <>W<sub>par</sub></>, value: formatSI(Wind_par, 'J') },
          { label: <>X<sub>l,par</sub></>, value: formatSI(Xl_par, 'Ω') },
          { label: <>L<sub>ser</sub></>, value: formatSI(Lser, 'H'), value_min: formatSI(LserMin), value_max: formatSI(LserMax) },
          { label: <>W<sub>ser</sub></>, value: formatSI(Wind_ser, 'J') },
          { label: <>X<sub>l,ser</sub></>, value: formatSI(Xl_ser, 'Ω') },
        ]} />
      )}
    </div>
  );
}