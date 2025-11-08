import { asymmetricStriplineZoFormula, broadsideCoupledStriplineZoFormula, edgeCoupledMicrostripZoFormula, edgeCoupledStriplineZoFormula, embeddedMicrostripZoFormula, microstripZoFormula, microstripZoHammerstadFormula, striplineZoFormula } from "@/lib/impedance";
import { parseSI } from "@/lib/si";
import { copperWeightsList, pcbMaterials } from "@/lib/units";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { Select } from "@/ui/components/Select";
import { useMemo, useState } from "preact/hooks";

// Topology ids
const TOPS = {
  MICROSTRIP: 'microstrip',
  EMBEDDED_MICROSTRIP: 'embed_microstrip',
  EDGE_COUPLED_MICROSTRIP: 'edge_coupled_microstrip',
  STRIPLINE: 'stripline',
  EDGE_COUPLED_STRIPLINE: 'edge_coupled_stripline',
  BROADSIDE_COUPLED_STRIPLINE: 'broadside_coupled_stripline',
  ASYMMETRIC_STRIPLINE: 'asymmetric_stripline',
} as const;

type TopId = typeof TOPS[keyof typeof TOPS];

type Geo = {
  h?: string;   // substrate height
  w?: string;   // trace width
  s?: string;   // spacing between traces
  hp?: string;  // height to plane (top)
  ht?: string;  // height between traces (broadside)
};

export function ImpedanceTab() {
  const [topology, setTopology] = useState<TopId>(TOPS.MICROSTRIP);

  // shared material props
  const [material, setMaterial] = useState('FR-4 (Standard)');
  const [er, setEr] = useState('4.6');
  const [copper, setCopper] = useState('1oz');

  const [geo, setGeo] = useState<Geo>({ h: '0.125', w: '0.25', s: '0.15', hp: '0.125', ht: '0.125' });

  const upd = (k: keyof Geo) => (v: string) => setGeo(g => ({ ...g, [k]: v }));

  const H = parseSI(geo.h ?? '') ?? 0;
  const W = parseSI(geo.w ?? '') ?? 0;
  const S = parseSI(geo.s ?? '') ?? 0;
  const HP = parseSI(geo.hp ?? '') ?? 0;
  const HT = parseSI(geo.ht ?? '') ?? 0;
  const ER = parseFloat(er) || 4.2;

  const rows = useMemo(() => {
    let res: { label: preact.ComponentChildren; value: string }[] = [];

    switch (topology) {
      case TOPS.MICROSTRIP: {
        const z0 = microstripZoFormula(H, W, copper, ER); // microstripZoHammerstadFormula
        res = [{ label: <>Z<sub>0</sub></>, value: (isFinite(z0) ? z0.toFixed(2) : '—') + ' Ω' }];
        break;
      }
      case TOPS.EMBEDDED_MICROSTRIP: {
        const z0 = embeddedMicrostripZoFormula(H, HP, W, copper, ER);
        res = [{ label: <>Z<sub>0</sub></>, value: (isFinite(z0) ? z0.toFixed(2) : '—') + ' Ω' }];
        break;
      }
      case TOPS.EDGE_COUPLED_MICROSTRIP: {
        const zd = edgeCoupledMicrostripZoFormula(H, W, S, copper, ER);
        res = [{ label: <>Z<sub>d</sub></>, value: (isFinite(zd) ? zd.toFixed(2) : '—') + ' Ω' }];
        break;
      }
      case TOPS.STRIPLINE: {
        const z0 = striplineZoFormula(H, W, copper, ER);
        res = [{ label: <>Z<sub>0</sub></>, value: (isFinite(z0) ? z0.toFixed(2) : '—') + ' Ω' }];
        break;
      }
      case TOPS.EDGE_COUPLED_STRIPLINE: {
        const { z0, zd } = edgeCoupledStriplineZoFormula(H, W, S, copper, ER);
        res = [
          { label: <>Z<sub>0</sub></>, value: (isFinite(z0) ? z0.toFixed(2) : '—') + ' Ω' },
          { label: <>Z<sub>d</sub></>, value: (isFinite(zd) ? zd.toFixed(2) : '—') + ' Ω' },
        ];
        break;
      }
      case TOPS.BROADSIDE_COUPLED_STRIPLINE: {
        const z0 = broadsideCoupledStriplineZoFormula(HP, HT, W, copper, ER);
        res = [{ label: <>Z<sub>0</sub></>, value: (isFinite(z0) ? z0.toFixed(2) : '—') + ' Ω' }];
        break;
      }
      case TOPS.ASYMMETRIC_STRIPLINE: {
        const z0 = asymmetricStriplineZoFormula(H, HP, W, copper, ER);
        res = [{ label: <>Z<sub>0</sub></>, value: (isFinite(z0) ? z0.toFixed(2) : '—') + ' Ω' }];
        break;
      }
    }

    return res;
  }, [topology, H, W, S, HP, HT, ER, copper]);

  // Material panel (shared)
  const materialPanel = (
    <div class="grid cols-3">
      <Select
        label="Base Copper Weight"
        value={copper}
        onChange={setCopper}
        options={copperWeightsList.map(w => ({ label: w, value: w }))}
      />

      <Select
        label="Material Selection"
        value={material}
        onChange={(v) => {
          setMaterial(v);
          if (v !== 'Custom') {
            const m = pcbMaterials.find(m => m.name === v);
            if (m) setEr(String(m.epsilon));
          }
        }}
        options={[...pcbMaterials.map(m => ({ label: m.name, value: m.name })), { label: 'Custom', value: 'Custom' }]}
      />

      <Input label="Er" value={er} onChange={setEr} disabled={material !== 'Custom'} />
    </div>
  );

  const geoFields = (() => {
    switch (topology) {
      case TOPS.MICROSTRIP:
        return (
          <div>
            <Input label="Substrate height (h), mm" value={geo.h!} onChange={upd('h')} />
            <Input label="Trace width (w), mm" value={geo.w!} onChange={upd('w')} />
          </div>
        );
      case TOPS.EMBEDDED_MICROSTRIP:
        return (
          <div>
            <Input label="Substrate height (h), mm" value={geo.h!} onChange={upd('h')} />
            <Input label="Trace height above plane (hp), mm" value={geo.hp!} onChange={upd('hp')} />
            <Input label="Trace width (w), mm" value={geo.w!} onChange={upd('w')} />
          </div>
        );
      case TOPS.EDGE_COUPLED_MICROSTRIP:
        return (
          <div>
            <Input label="Height (h), mm" value={geo.h!} onChange={upd('h')} />
            <Input label="Trace width (w), mm" value={geo.w!} onChange={upd('w')} />
            <Input label="Trace spacing (s), mm" value={geo.s!} onChange={upd('s')} />
          </div>
        );
      case TOPS.STRIPLINE:
        return (
          <div>
            <Input label="Substrate height (h), mm" value={geo.h!} onChange={upd('h')} />
            <Input label="Trace width (w), mm" value={geo.w!} onChange={upd('w')} />
          </div>
        );
      case TOPS.EDGE_COUPLED_STRIPLINE:
        return (
          <div>
            <Input label="Height (h), mm" value={geo.h!} onChange={upd('h')} />
            <Input label="Trace width (w), mm" value={geo.w!} onChange={upd('w')} />
            <Input label="Trace spacing (s), mm" value={geo.s!} onChange={upd('s')} />
          </div>
        );
      case TOPS.BROADSIDE_COUPLED_STRIPLINE:
        return (
          <div>
            <Input label="Height to plane (hₚ), mm" value={geo.hp!} onChange={upd('hp')} />
            <Input label="Height between traces (hₜ), mm" value={geo.ht!} onChange={upd('ht')} />
            <Input label="Trace width (w), mm" value={geo.w!} onChange={upd('w')} />
          </div>
        );
      case TOPS.ASYMMETRIC_STRIPLINE:
        return (
          <div>
            <Input label="Substrate height (h), mm" value={geo.h!} onChange={upd('h')} />
            <Input label="Trace height above plane (hp), mm" value={geo.hp!} onChange={upd('hp')} />
            <Input label="Trace width (w), mm" value={geo.w!} onChange={upd('w')} />
          </div>
        );
    }
  })();

  return (
    <div class="grid cols-1">
      <div class="hint">† This calculator uses IPC-2221A forlumas</div>
      <Select
        label="Topology"
        value={topology}
        onChange={(v) => setTopology(v as TopId)}
        options={[
          { label: 'Microstrip', value: TOPS.MICROSTRIP },
          { label: 'Embedded Microstrip', value: TOPS.EMBEDDED_MICROSTRIP },
          { label: 'Edge Coupled Microstrip', value: TOPS.EDGE_COUPLED_MICROSTRIP },
          { label: 'Stripline', value: TOPS.STRIPLINE },
          { label: 'Edge Coupled Stripline', value: TOPS.EDGE_COUPLED_STRIPLINE },
          { label: 'Broadside Coupled Stripline', value: TOPS.BROADSIDE_COUPLED_STRIPLINE },
          { label: 'Asymmetric Stripline', value: TOPS.ASYMMETRIC_STRIPLINE },
        ]}
      />

      {materialPanel}

      {geoFields}

      <ResultCard rows={rows} />
    </div>
  );
}
