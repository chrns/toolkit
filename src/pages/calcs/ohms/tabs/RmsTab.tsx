import { parseSI, formatSI } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { useState } from "preact/hooks";
import { voltagePlaceholder } from '@/pages/calcs/shared';
import { Select } from "@/ui/components/Select";
import { TextArea } from "@/ui/components/TextArea"
import { sampleAdcData } from "@/lib/adc";
import { parseSamples } from "@/lib/utils";

function getVoltages(mode: string, vpk: number, voffset: number = 0, samplesText?: string): [rms: number, avg: number] {
  let rms: number = 0, avg: number = 0;
  switch (mode) {
    case 'sine':
      rms = vpk / Math.sqrt(2);
      avg = 0;
      break;
    case 'full_rectified':
      rms = vpk / Math.sqrt(2);
      avg = 0.637 * vpk;
      break;
    case 'half_rectified':
      rms = vpk / 2;
      avg = 0.318 * vpk;
      break;
    case 'sine_offset':
      rms = Math.sqrt(vpk * vpk / 2 + voffset * voffset);
      avg = voffset;
      break;
    case 'square':
      rms = vpk;
      break;
    case 'triangle':
      rms = vpk / Math.sqrt(3);
      break;
    case 'sawtooth':
      rms = vpk / Math.sqrt(2);
      break;
    case 'custom': {
      const xs = parseSamples(samplesText || '');
      const n = xs.length;
      if (n > 0) {
        let s1 = 0, s2 = 0;
        for (const x of xs) {
          s1 += x;
          s2 += x * x;
        }
        avg = s1 / n;
        rms = Math.sqrt(s2 / n);
      }
      break;
    }
  }
  return [rms, avg];
}

export function RmsTab() {
  const [mode, setMode] = useState('sine');
  const [Vpk, setVpk] = useState('110');
  const [Voffset, setVoffset] = useState('0');
  const [samplesText, setSamplesText] = useState(sampleAdcData.toString());

  const vpk: number = parseSI(Vpk) ?? 0;
  const voffset: number = parseSI(Voffset) ?? 0;

  const [rms, avg] = getVoltages(mode, vpk, voffset, samplesText);
  const cf = rms / avg;

  const rows = [
    { label: <>RMS voltage, <>V<sub>rms</sub></></>, value: formatSI(rms, 'V', 2) },
    { label: <>Average voltage, <>V<sub>avg</sub></></>, value: formatSI(avg, 'V', 2) },
    { label: <>Crest factor / PAPR</>, value: formatSI(cf, '', 2) + ' / ' + formatSI(cf * cf, '', 2) },
  ];

  return (
    <div class="grid cols-2">
      <div>
        <Select
          label="Data format"
          value={mode}
          onChange={(v) => setMode((v as any) || 'sine')}
          options={[
            { value: 'sine', label: 'Sine wave' },
            { value: 'full_rectified', label: 'Full rectified sine wave' },
            { value: 'half_rectified', label: 'Half rectified sine wave' },
            { value: 'sine_offset', label: 'Sine wave + Offset' },
            { value: 'square', label: 'Square wave' },
            { value: 'triangle', label: 'Triangle wave' },
            { value: 'sawtooth', label: 'Sawtooth wave' },
            { value: 'custom', label: 'Custom wave' },
          ]}
        />
        {mode != 'custom' && (
          <Input label={<>Peak voltage, V<sub>pk</sub></>} value={Vpk} onChange={setVpk} suffix="V" placeholder={voltagePlaceholder} />
        )}
        {mode === 'sine_offset' && (
          <div class="grid">
            <Input label={<>Offset voltage, V<sub>offset</sub></>} value={Voffset} onChange={setVoffset} suffix="V" placeholder={voltagePlaceholder} />
          </div>
        )}
        {mode === 'custom' && (
          <div class="grid">
            <TextArea
              label="Samples (comma/space/newline separated)"
              value={samplesText}
              onChange={setSamplesText}
              placeholder="e.g., 1023, 1050, 1070, ..."
              rows={8}
            />
          </div>
        )}

      </div>
      <ResultCard rows={[...rows]} />
    </div>
  );
}