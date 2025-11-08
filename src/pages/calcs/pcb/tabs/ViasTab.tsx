import { parseSI, formatSI, ozToUmMap } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { useState } from "preact/hooks";
import { Select } from "@/ui/components/Select";
import { copperWeightsList, pcbMaterials } from "@/lib/units";

export function ViasTab() {
  const [Material, setMaterial] = useState('FR-4 (Standard)');
  const [Er, setEr] = useState('4.6');
  const [Copper, setCopper] = useState('1oz');

  const [ViaHoleDiam, setViaHoleDiam] = useState('0.3m');
  const [IntPadDiam, setIntPadDiam] = useState('0.6m');
  const [ViaHeight, setViaHeight] = useState('1.5m');

  const d = parseSI(ViaHoleDiam) ?? 0;
  const p = parseSI(IntPadDiam) ?? 0;
  const h = parseSI(ViaHeight) ?? 0;
  const er = Number(Er) || 4.6; // relative permittivity (dimensionless)

  // Inductance of a via
  const METERS_TO_INCH = 39.3701;
  const inductance = 5.08e-9 * METERS_TO_INCH * h * (Math.log((4 * h) / (d)) + 1);
  const capacitance = 0.55e-10 * er * h * p / (p - d);
  const viaSrf = 1 / (2 * Math.PI * Math.sqrt(inductance * capacitance));
  const impedance = Math.sqrt(inductance / capacitance);

  const rows = ([
    { label: 'Capacitance', value: formatSI(capacitance, 'F') },
    { label: 'Inductance', value: formatSI(inductance, 'H') },
    { label: 'Self-resonant frequency', value: formatSI(viaSrf, 'Hz') },
    { label: 'Impedance', value: formatSI(impedance, 'Ω') },
  ]);

  return (
    <div class="grid cols-2">
      <div>
        <Select
          label="Base Copper Weight"
          value={Copper}
          onChange={setCopper}
          options={copperWeightsList.map(w => ({ label: w, value: w }))}
        />

        <Select
          label="Material Selection"
          value={Material}
          onChange={(v) => {
            setMaterial(v);
            if (v !== 'Custom') {
              const m = pcbMaterials.find(m => m.name === v);
              if (m) setEr(String(m.epsilon));
            }
          }}
          options={[...pcbMaterials.map(m => ({ label: m.name, value: m.name })), { label: 'Custom', value: 'Custom' }]}
        />
        <Input label="Er" value={Er} onChange={setEr} disabled={Material !== 'Custom'} />
        <Input label="Via Hole Diameter" value={ViaHoleDiam} onChange={setViaHoleDiam} />
        <Input label="Internal Pad Diameter" value={IntPadDiam} onChange={setIntPadDiam} />
        <Input label="Via Height" value={ViaHeight} onChange={setViaHeight} />
      </div>
      <ResultCard rows={rows} />
    </div>
  );
}