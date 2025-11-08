import { useMemo, useState } from "preact/hooks";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { parseSI, formatSI } from "@/lib/si";
import { Select } from "@/ui/components/Select";

type BatteryChem = 'SLA' | 'Li-Ion' | 'LiFePO4' | 'NiMH';
type BatteryHealth = 'Good' | 'Warning' | 'Worn out';
type ChemKey = 'sla' | 'liion' | 'lifepo4' | 'nimh';
const CHEM_MAP: Record<ChemKey, BatteryChem> = {
  sla: 'SLA',
  liion: 'Li-Ion',
  lifepo4: 'LiFePO4',
  nimh: 'NiMH',
};
const ESR_THRESH_mOhm: Record<BatteryChem, { goodMax: number; warnMax: number }> = {
  'SLA': { goodMax: 70, warnMax: 120 },
  'Li-Ion': { goodMax: 60, warnMax: 120 },
  'LiFePO4': { goodMax: 25, warnMax: 60 },
  'NiMH': { goodMax: 80, warnMax: 150 },
};
function getBatteryHealth(chem: BatteryChem, rOhm: number): BatteryHealth {
  if (!Number.isFinite(rOhm) || rOhm <= 0) return 'Worn out';
  const r_mOhm = rOhm * 1e3;
  const th = ESR_THRESH_mOhm[chem];
  if (!th) return 'Worn out';
  if (r_mOhm <= th.goodMax) return 'Good';
  if (r_mOhm <= th.warnMax) return 'Warning';
  return 'Worn out';
}

const ALPHA_PER_CHEM: Record<BatteryChem, number> = {
  'Li-Ion': 0.005, 'LiFePO4': 0.005, 'SLA': 0.0035, 'NiMH': 0.0055,
};

export function BatteryMetricsTab() {
  const [chemKey, setChemKey] = useState<ChemKey>('sla');
  const [IdleVoltage, setIdleVoltage] = useState('14.2');
  const [UnderLoadVoltage, setUnderLoadVoltage] = useState('12.7');
  const [LoadCurrent, setLoadCurrent] = useState('6');
  const [TempC, setTempC] = useState('50');

  const vIdle = parseSI(IdleVoltage) ?? 0;
  const vLoad = parseSI(UnderLoadVoltage) ?? 0;
  const iLoad = parseSI(LoadCurrent) ?? 1;
  const T = parseSI(TempC) ?? 25;

  const dcIntRes = (vIdle - vLoad) / iLoad;
  const alpha = ALPHA_PER_CHEM[CHEM_MAP[chemKey]];
  const r25 = dcIntRes / (1 + alpha * (T - 25));

  const rows = [
    { label: <>R<sub>int</sub> / R<sub>int</sub>(T)</>, value: formatSI(dcIntRes, 'Ω', 2) + ' / ' + formatSI(r25, 'Ω', 2) },
    { label: <>Estimated health status</>, value: getBatteryHealth(CHEM_MAP[chemKey], dcIntRes) },
  ];

  return (
    <div class="grid cols-2">
      <div class="grid">
        <div class="hint">
          Under load current should be about ~1C. Voltage should be measured after 100 ms.
        </div>
        <div class="grid cols-2">
          <Select
            label="Battery Chemestry"
            value={chemKey}
            onChange={(k) => {
              setChemKey(k as ChemKey);
              switch (k) {
                case 'sla':
                  setIdleVoltage('14.0'); setUnderLoadVoltage('13.7'); setLoadCurrent('10');
                  break;
                case 'liion':
                  setIdleVoltage('3.7'); setUnderLoadVoltage('3.65'); setLoadCurrent('3');
                  break;
                case 'lifepo4':
                  setIdleVoltage('3.2'); setUnderLoadVoltage('3.15'); setLoadCurrent('2');
                  break;
                case 'nimh':
                  setIdleVoltage('1.2'); setUnderLoadVoltage('1.195'); setLoadCurrent('100m');
                  break;
              }
            }}
            options={[
              { value: 'sla', label: 'Sealed Lead-Acid' },
              { value: 'liion', label: 'Li-Ion' },
              { value: 'lifepo4', label: 'LiFePO4' },
              { value: 'nimh', label: 'NiMH' },
            ]}
          />
          <Input
            label="Idle Voltage"
            value={IdleVoltage}
            onChange={setIdleVoltage}
            suffix="V"
            placeholder="12"
          />
          <Input
            label="Under Load Voltage"
            value={UnderLoadVoltage}
            onChange={setUnderLoadVoltage}
            suffix="V"
            placeholder="11"
          />
          <Input
            label="Load Current"
            value={LoadCurrent}
            onChange={setLoadCurrent}
            suffix="A"
            placeholder="1"
          />
          <Input
            label="Temperature"
            value={TempC}
            onChange={setTempC}
            suffix="°C"
            placeholder="25"
          />
        </div>
      </div>

      <ResultCard
        rows={rows}
      />
    </div>
  );
}

export default BatteryMetricsTab;
