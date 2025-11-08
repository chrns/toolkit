import { useMemo, useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { ResultCard } from '@/ui/components/ResultCard';
import { parseSI, formatSI } from '@/lib/si';

export function AttenuatorTab() {
  const [AdB, setAdB] = useState('3');
  const [Z0s, setZ0s] = useState('50');

  const A_dB = Math.max(0, parseSI(AdB) ?? 0);
  const Z0 = Math.max(1e-9, parseSI(Z0s) ?? 50);
  const a = Math.pow(10, A_dB / 20);
  const a2 = a * a;

  const pi = useMemo(() => {
    const R2 = (Z0 * (a2 - 1)) / (2 * a);
    const denom = (a2 + 1) / (Z0 * (a2 - 1)) - 1 / Math.max(R2, 1e-12);
    const R1 = 1 / denom;
    const R3 = R1;
    return { R1, R2, R3 };
  }, [Z0, a2, a]);

  const tee = useMemo(() => {
    const R2 = (2 * a * Z0) / (a2 - 1);
    const R1 = Z0 * ((a2 + 1) / (a2 - 1)) - R2;
    const R3 = R1;
    return { R1, R2, R3 };
  }, [Z0, a2, a]);

  const bridged = useMemo(() => {
    const R1 = Z0;
    const R3 = Z0;
    const R2 = Z0 / Math.max(a - 1, 1e-12);
    const R4 = Z0 * (a - 1);
    return { R1, R2, R3, R4 };
  }, [Z0, a]);

  const rows = useMemo(() => ([
    { label: 'Pi', value: formatSI(pi.R1, 'Ω') + ' | ' + formatSI(pi.R2, 'Ω') + ' | ' + formatSI(pi.R3, 'Ω') },
    { label: 'Tee', value: formatSI(tee.R1, 'Ω') + ' | ' + formatSI(tee.R2, 'Ω') + ' | ' + formatSI(tee.R3, 'Ω') },
    { label: 'Bridged Tee', value: formatSI(bridged.R2, 'Ω') + ' | ' + formatSI(bridged.R4, 'Ω') },
  ]), [pi, tee, bridged]);

  return (
    <div class="grid cols-2">
      <div>
        <Input label="Attenuation" value={AdB} onChange={setAdB} suffix="dB" placeholder="3" />
        <Input label={<>Z<sub>0</sub> (matched)</>} value={Z0s} onChange={setZ0s} suffix="Ω" placeholder="50" />
      </div>
      <ResultCard rows={rows} />
    </div>
  );
}