import { useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { ResultCard } from '@/ui/components/ResultCard';
import { parseSI, formatSI } from '@/lib/si';
import { findClosestESeriesValue } from '@/lib/solvers';

const defaultLoadCapacitance: string = '10p';
const defaultStrayCapacitance: string = '5p';
const defaultXTALCapacitance: string = '0';
const defaultPpmPerPico: string = '-20';
const defaultQuartzFreq: string = '25M';
const defaultQuartzPpm: string = "20";

export function QuartzTab() {
  // XTAL load capacitance block
  const [Freq, setFreq] = useState(defaultQuartzFreq);
  const [PPM, setPPM] = useState(defaultQuartzPpm);
  const [CLRaw, setCLs] = useState(defaultLoadCapacitance);
  const [CSRaw, setCss] = useState(defaultStrayCapacitance);
  // XTAL pins parasite capacitance
  const [XTALInRaw, setCinPin] = useState(defaultXTALCapacitance);
  const [XTALOoutRaw, setCoutPin] = useState(defaultXTALCapacitance);
  const [PpmPerPicoRaw, setKppm] = useState(defaultPpmPerPico);

  // Parse to numbers (SI-aware)
  const CL = Math.max(0, parseSI(CLRaw) ?? 0);
  const CS = Math.max(0, parseSI(CSRaw) ?? 0);

  const XTALIn = Math.max(0, parseSI(XTALInRaw) ?? 0);
  const XTALOut = Math.max(0, parseSI(XTALOoutRaw) ?? 0);
  const Kppm = (parseSI(PpmPerPicoRaw) ?? 0);
  const freq = (parseSI(Freq) ?? 0)

  // Symetric design, C1 == C2
  const Ceq = Math.max(0, 2 * (CL - CS));
  const symSolution = findClosestESeriesValue(Ceq, 'E192');
  // Symmetric effective load using suggested E-series value and real pin caps
  const C1eff_sym = symSolution.value;
  const C2eff_sym = symSolution.value;
  const Cload_sym = (C1eff_sym > 0 && C2eff_sym > 0) ? ((C1eff_sym * C2eff_sym) / (C1eff_sym + C2eff_sym) + CS) : 0;
  const dC_sym = Cload_sym - CL; // F
  const dC_sym_pF = dC_sym / 1e-12;
  const ppm_from_load_sym = Kppm * dC_sym_pF;
  // const dF_load_Hz_sym = freq > 0 ? (freq * ppm_from_load_sym / 1e6) : 0;

  // Asymetric design, where XTAL_IN != XTAL_OUT. C1 != C2
  const S_target = Math.max(0, 2 * (CL - CS));
  const C1_opt = Math.max(0, S_target - XTALIn);
  const C2_opt = Math.max(0, S_target - XTALOut);
  // Round asymmetric optimal caps to E192 and compute resulting load/ppm
  const c1e = findClosestESeriesValue(C1_opt, 'E24');
  const c2e = findClosestESeriesValue(C2_opt, 'E24');
  const C1eff_e = c1e.value + XTALIn;
  const C2eff_e = c2e.value + XTALOut;
  const Cload_e = (C1eff_e > 0 && C2eff_e > 0) ? ((C1eff_e * C2eff_e) / (C1eff_e + C2eff_e) + CS) : 0;
  const dC_e = Cload_e - CL;
  const dC_e_pF = dC_e / 1e-12;
  const ppm_from_load_e = Kppm * dC_e_pF;

  const loadRows = [
    { label: <>C<sub>1</sub> / C<sub>2</sub> (E192)</>, value: formatSI(Ceq, 'F') + ' (' + formatSI(symSolution.value, 'F') + ')' },
    { label: <>C<sub>load</sub> (error)</>, value: formatSI(Cload_sym, 'F') + ' (' + ppm_from_load_sym.toFixed(2) + ' ppm)' },

    { label: <>Asym. C<sub>1</sub> & C<sub>2</sub></>, value: formatSI(C1_opt, 'F') + ' & ' + formatSI(C2_opt, 'F') },
    { label: <>C<sub>1</sub><sup>E192</sup> & C<sub>2</sub><sup>E192</sup></>, value: formatSI(c1e.value, 'F') + ' & ' + formatSI(c2e.value, 'F') },
    { label: <>C<sub>load</sub><sup>E192</sup> (error)</>, value: formatSI(Cload_e, 'F') + ' (' + ppm_from_load_e.toFixed(2) + ' ppm)' },
  ];

  return (
    <div class="grid cols-2">
      <div>
        <h3>Quartz settings</h3>
        <div class="grid cols-2">
          <Input label="Center frequency" value={Freq} onChange={setFreq} suffix="Hz" placeholder={defaultQuartzFreq} />
          <Input label="PPM value" value={PPM} onChange={setPPM} suffix="PPM" placeholder={defaultQuartzPpm} />
          <Input label={<>Load capacitance C<sub>L</sub></>} value={CLRaw} onChange={setCLs} suffix="F" placeholder={defaultLoadCapacitance} />
          <Input label={<>Stray capacitance C<sub>s</sub></>} value={CSRaw} onChange={setCss} suffix="F" placeholder={defaultStrayCapacitance} />
        </div>
        <Input label="Load sensitivity (ppm per +1 pF)" value={PpmPerPicoRaw} onChange={setKppm} suffix="ppm/pF" placeholder={defaultPpmPerPico} />

        <h4>Asumetric design</h4>

        <div class="grid cols-2">
          <Input label="XTAL_IN pin capacitance" value={XTALInRaw} onChange={setCinPin} suffix="F" placeholder="5p" />
          <Input label="XTAL_OUT pin capacitance" value={XTALOoutRaw} onChange={setCoutPin} suffix="F" placeholder="3p" />
        </div>
      </div>

      <div class="grid">
        <ResultCard rows={loadRows} />
      </div>
    </div >
  );
}
