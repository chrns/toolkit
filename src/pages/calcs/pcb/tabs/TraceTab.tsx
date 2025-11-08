import { parseSI, formatSI, ozToUmMap } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { useState, useMemo } from "preact/hooks";
import { getTraceResistance, getTraceTransientCurrent } from '@/lib/solvers'
import { Select } from "@/ui/components/Select";
import { copperWeightsList } from "@/lib/units";

const defaultWidth: string = "1m";
const defaultLength: string = "10m";
const defaultThickness: string = "1oz";
const defaultTemperature: string = "20";
const defaultCurrent: string = "1";
const defaultTPulse: string = "5m";

export function TraceTab() {
  const [width, setWidth] = useState(defaultWidth);
  const [length, setLength] = useState(defaultLength);
  const [thickness, setThickness] = useState(defaultThickness);
  const [temperature, setTemperature] = useState(defaultTemperature);
  const [current, setCurrent] = useState(defaultCurrent);
  const [tPulse, setTPulse] = useState(defaultTPulse);

  const w = parseSI(width) ?? 0;
  const l = parseSI(length) ?? 0;
  const t = parseSI(String(ozToUmMap[thickness] * 1e-6)) ?? 35e-6;
  const ta = parseSI(temperature) ?? 0;
  const I = parseSI(current) ?? 0;
  const tp = parseSI(tPulse) ?? 0;

  const resistance = getTraceResistance(w, l, t, ta);
  const vDrop = I * resistance;
  const loss = I * I * resistance;
  const transientCurrent = getTraceTransientCurrent(w, t, tp);

  // const innerTransientCurrent = getInnerTraceTransientCurrent(w, t, ta);

  const rows = useMemo(() => ([
    { label: 'Resistance', value: formatSI(resistance, 'Ω') },
    { label: 'Voltage drop', value: formatSI(vDrop, 'V') },
    { label: 'Power loss', value: formatSI(loss, 'W') },
    { label: 'Transient Current', value: formatSI(transientCurrent, 'A') },
    // { label: 'Inner trace current', value: formatSI(innerTransientCurrent, 'A') },
  ]), [width, length, thickness, temperature, current, tPulse]);

  return (
    <div class="grid cols-2">
      <div>
        <div class="hint">For t<sub>p</sub> &gt; 0 Onderdonk formula is used, Preece otherwise</div>
        <div class="grid cols-2">
          <Input label="Trace width (w)" value={width} onChange={setWidth} suffix="m" />
          <Input label="Trace length (l)" value={length} onChange={setLength} suffix="m" />
          <Select
            label="Base copper weight (t)"
            value={thickness}
            onChange={setThickness}
            options={copperWeightsList.map(w => ({ label: w, value: w }))}
          />
          <Input label="Temperature (ta)" value={temperature} onChange={setTemperature} suffix="°C" />
          <Input label="Current" value={current} onChange={setCurrent} suffix="A" />
          <Input label="Transient time" value={tPulse} onChange={setTPulse} suffix="s" />
        </div>
      </div>
      <ResultCard rows={rows} />
    </div>
  );
}