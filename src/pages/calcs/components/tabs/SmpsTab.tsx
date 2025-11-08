import { useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { ResultCard } from '@/ui/components/ResultCard';
import { parseSI, formatSI } from '@/lib/si';
import { PinIcon } from '@/ui/icons/PinIcon';

export function SmpsTab() {
  // Inputs
  const [InputVoltage, setInputVoltage] = useState('25');
  const [OutputVoltage, setOutputVoltage] = useState('12');
  const [DiodeVoltageDrop, setDiodeVoltageDrop] = useState('0.7');
  const [TransistorVoltageDrop, setTransistorVoltageDrop] = useState('0.1');
  const [Frequency, setFrequency] = useState('100k');
  const [OutputCurrent, setOutputCurrent] = useState('800m');
  const [VoltageRipple, setVoltageRipple] = useState('0.12');

  // Mutually exclusive fields (Iout_min vs Ripple%)
  const [isIndCurMode, setIndCurMode] = useState(true);
  const toggleMode = () => { setIndCurMode(!isIndCurMode); };
  const [MinimumOutputCurrent, setMinimumOutputCurrent] = useState('200m');
  const [InductorCurrentRipple, setInductorCurrentRipple] = useState('20');

  const vin = parseSI(InputVoltage) ?? 0;
  const vout = parseSI(OutputVoltage) ?? 0;
  const vd = parseSI(DiodeVoltageDrop) ?? 0;
  const vt = parseSI(TransistorVoltageDrop) ?? 0;
  const fsw = parseSI(Frequency) ?? 1e-12;
  const iout = parseSI(OutputCurrent) ?? 0;
  const voutRipplePP = parseSI(VoltageRipple) ?? 1e-12;

  type Topology = 'Buck' | 'Boost' | 'Inverting';
  const detectTopology = (vin: number, vout: number): Topology => {
    if (vout < 0) return 'Inverting';
    if (vout > vin) return 'Boost';
    return 'Buck';
  };
  const topology: Topology = detectTopology(vin, vout);
  const ripplePctInput = parseSI(InductorCurrentRipple) ?? 0;
  const IoutMin = parseSI(MinimumOutputCurrent) ?? 0;
  let D = 0, iAvg = 0, deltaI = 0, L = 0, C = 0;

  if (topology === 'Buck') {
    D = (vout + vd) / (vin - vt + vd);
    const iAvg_min = !isIndCurMode ? IoutMin : iout;
    iAvg = iout;
    deltaI = isIndCurMode ? (ripplePctInput / 100) * iout : 2 * iAvg_min;
    L = D * (vin - vt - vout) / (deltaI * fsw);
    C = deltaI / (8 * fsw * voutRipplePP);
  } else if (topology === 'Boost') {
    D = 1 - (vin - vt) / (vout + vd);
    iAvg = (vout * iout) / vin;
    const iAvg_min = !isIndCurMode ? (vout * IoutMin) / vin : iAvg;
    deltaI = isIndCurMode ? (ripplePctInput / 100) * iAvg : 2 * iAvg_min;
    L = D * (vin - vt) / (deltaI * fsw);
    C = iout * D / (fsw * voutRipplePP);
  } else {
    const Vo = Math.abs(vout);
    D = (Vo + vd) / (vin - vt + Vo + vd);
    iAvg = (Vo * iout) / vin;
    const iAvg_min = !isIndCurMode ? (Vo * IoutMin) / vin : iAvg;
    deltaI = isIndCurMode ? (ripplePctInput / 100) * iAvg : 2 * iAvg_min;
    L = D * (vin - vt) / (deltaI * fsw);
    C = (iout * D) / (fsw * voutRipplePP);
  }
  const iPk = iAvg + deltaI / 2;
  const iRms = Math.sqrt(iAvg * iAvg + (deltaI * deltaI) / 12);

  const rows = [
    { label: <>Topology</>, value: topology },
    { label: <>Duty Cycle, D</>, value: formatSI(D * 100, '%', 4) },
    { label: <>I<sub>L,avg</sub></>, value: formatSI(iAvg, 'A', 4) },
    { label: <>ΔI<sub>L</sub></>, value: formatSI(deltaI, 'A', 4) },
    { label: <>I<sub>pk</sub></>, value: formatSI(iPk, 'A', 4) },
    { label: <>I<sub>rms</sub></>, value: formatSI(iRms, 'A', 4) },
    { label: <>L</>, value: formatSI(L, 'H', 4) },
    { label: <>C<sub>out</sub></>, value: formatSI(C, 'F', 4) },
  ];

  return (
    <div class="grid cols-2">
      <div>
        <div class="hint">
          Buck mode (V<sub>in</sub> &gt; V<sub>out</sub>); Boost mode (V<sub>in</sub> &lt; V<sub>out</sub>); Inverting mode (V<sub>out</sub> &lt; 0).
        </div>
        <hr />
        <div class="grid cols-2">
          <Input label={<>Input voltage, V<sub>in</sub></>} value={InputVoltage} onChange={setInputVoltage} suffix="V" placeholder="5" />
          <Input label={<>Output voltage, V<sub>out</sub></>} value={OutputVoltage} onChange={setOutputVoltage} suffix="V" placeholder="3.3" />
          <Input label={<>Diode Voltage Drop, V<sub>d</sub></>} value={DiodeVoltageDrop} onChange={setDiodeVoltageDrop} suffix="V" placeholder="0.7" />
          <Input label={<>Transistor Voltage Drop, V<sub>t</sub></>} value={TransistorVoltageDrop} onChange={setTransistorVoltageDrop} suffix="V" placeholder="0.1" />
          <Input label={<>Frequency, f<sub>sw</sub></>} value={Frequency} onChange={setFrequency} suffix="Hz" placeholder="100k" />
          <Input label={<>Output Current, I<sub>out</sub></>} value={OutputCurrent} onChange={setOutputCurrent} suffix="A" placeholder="0.8" />
        </div>
        <Input label={<>Output ripple, ΔV<sub>out,pp</sub></>} value={VoltageRipple} onChange={setVoltageRipple} suffix="V" placeholder="0.12" />

        <div class="grid cols-2">
          <Input
            label={<>Minimum Output Current, I<sub>min,out</sub></>}
            value={MinimumOutputCurrent}
            onChange={setMinimumOutputCurrent}
            isFixed={isIndCurMode}
            onToggleFix={toggleMode}
            disabled={isIndCurMode}
            fixedContent={<PinIcon />}
            suffix="A"
            placeholder={''}
          />
          <Input
            label={<>Inductor Current Ripple, %</>}
            value={InductorCurrentRipple}
            onChange={setInductorCurrentRipple}
            isFixed={!isIndCurMode}
            onToggleFix={toggleMode}
            disabled={!isIndCurMode}
            fixedContent={<PinIcon />}
            suffix="%"
            placeholder={''}
          />
        </div>
      </div>
      <ResultCard rows={rows} />
    </div>
  );
}
