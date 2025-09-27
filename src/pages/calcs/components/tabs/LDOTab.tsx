import { useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { ResultCard } from '@/ui/components/ResultCard';
import { parseSI, formatSI } from '@/lib/si';

function n(raw: string): number { const v = parseSI(raw); return (typeof v === 'number' && Number.isFinite(v)) ? v : 0; }

export function LDOTab() {
  // Inputs
  const [Vin, setVin] = useState('5');
  const [Vout, setVout] = useState('3.3');
  const [Iload, setIload] = useState('500m');
  const [Iq, setIq] = useState('5m');

  // Parse
  const vin = n(Vin);
  const vout = n(Vout);
  const iload = n(Iload);
  const iq = n(Iq);

  // Dissipated power P_D = (Vin - Vout) * Iload + Vin * Iq
  const Pd = Math.max(0, (vin - vout) * iload + vin * iq);

  const rows = [
    { label: <>P<sub>D</sub> @ V<sub>in</sub></>, value: formatSI(Pd, 'W') },
  ];

  return (
    <div class="grid cols-2">
      <div class="grid">
        <Input label={<>Input voltage, V<sub>in</sub></>} value={Vin} onChange={setVin} suffix="V" placeholder="5" />
        <Input label={<>Output voltage, V<sub>out</sub></>} value={Vout} onChange={setVout} suffix="V" placeholder="3.3" />
        <Input label={<>Load current, I<sub>load</sub></>} value={Iload} onChange={setIload} suffix="A" placeholder="500m" />
        <Input label={<>Quiescent current, I<sub>q</sub></>} value={Iq} onChange={setIq} suffix="A" placeholder="5 mA" />
      </div>

      <div class="grid">
        <ResultCard rows={rows} />
      </div>
    </div>
  );
}
