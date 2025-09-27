import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { parseSI, formatSI } from "@/lib/si";
import { batteries } from "@/lib/units";
import CurrentProfile from "@/ui/components/CurrentProfile";
import { Select } from "@/ui/components/Select";

type ProfileItem = {
  id: string;
  current: string;
  duration: string;
};

const formatDuration = (seconds: number): string => {
  if (!isFinite(seconds) || seconds <= 0) return '0 s';
  if (seconds >= 3600) return (seconds / 3600).toFixed(2) + ' h';
  if (seconds >= 60) return (seconds / 60).toFixed(2) + ' min';
  if (seconds >= 1) return seconds.toFixed(2) + ' s';
  if (seconds >= 1e-3) return (seconds * 1e3).toFixed(2) + ' ms';
  if (seconds >= 1e-6) return (seconds * 1e6).toFixed(2) + ' us';
  return (seconds * 1e9).toFixed(2) + ' ns';
};

const parseCurrentA = (txt: string): number => {
  const s = (txt || '').trim();
  if (!s) return 0;
  const cleaned = s.replace(/\s*a$/i, '');
  const v = parseSI(cleaned);
  return (v ?? 0);
};

export function BatteryLifeTab() {
  const [batteryType, setBatteryType] = useState('LiSOCL2 (DD36000)');
  const [capacity, setCapacity] = useState('36000');
  const [selfDischarge, setSelfDischarge] = useState('0.08');
  const [nominalVoltage, setNominalVoltage] = useState('3.6');
  const [maxContCurrent, setContCurrent] = useState('450.0');
  const [maxPulseCurrent, setPulseCurrent] = useState('1000.0');

  const [dischargeCurrent, setDischargeCurrent] = useState('100m');

  const [timeFmt, setTimeFmt] = useState<'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years'>('Hours');

  const [mode, setMode] = useState<'constant' | 'profile'>('constant');

  const [profile, setProfile] = useState<ProfileItem[]>([
    { id: 'init1', current: '100mA', duration: '10us' },
    { id: 'init2', current: '800uA', duration: '10s' },
  ]);

  const profileStats = useMemo(() => {
    if (mode !== 'profile') return null as null | { period_s: number; Ieq_A: number };
    let Q_Ah = 0; // charge per period in Ah
    let T_s = 0;  // period in seconds
    const parseSeconds = (txt: string): number => {
      const s = (txt || '').trim();
      if (!s) return 0;
      // try raw number (seconds)
      const num = Number(s);
      if (isFinite(num)) return num;
      // match number + suffix
      const m = s.match(/^([+-]?[0-9]*\.?[0-9]+)\s*([a-zA-Zµ]+)$/);
      if (!m) return 0;
      const v = parseFloat(m[1]);
      const suf = m[2].toLowerCase();
      if (suf === 's' || suf === 'sec' || suf === 'secs') return v;
      if (suf === 'ms') return v * 1e-3;
      if (suf === 'us' || suf === 'µs') return v * 1e-6;
      if (suf === 'ns') return v * 1e-9;
      if (suf === 'min') return v * 60;
      if (suf === 'h' || suf === 'hr' || suf === 'hrs') return v * 3600;
      return 0;
    };
    for (const step of profile) {
      const I_A = parseCurrentA(step.current); // A
      const dt_s = parseSeconds(step.duration);
      Q_Ah += I_A * (dt_s / 3600);
      T_s += dt_s;
    }
    if (T_s <= 0) return { period_s: 0, Ieq_A: 0 };
    const Ieq_A = (Q_Ah / (T_s / 3600));
    return { period_s: T_s, Ieq_A };
  }, [mode, profile]);

  const lifeHours = useMemo(() => {
    const C_mAh = Number(capacity) || 0;
    const r_percent = Number(selfDischarge) || 0; // % per month
    const r = r_percent / 100; // fraction per month

    const monthHours = 30 * 24; // 720 h
    const k = r / monthHours; // per hour

    let I_mA = 0;
    if (mode === 'constant') {
      const I_A = parseSI(dischargeCurrent) ?? 0; // A
      I_mA = I_A * 1000;
    } else {
      const Ieq_A = profileStats?.Ieq_A ?? 0;
      I_mA = Ieq_A * 1000;
    }

    if (C_mAh <= 0 || I_mA <= 0) return 0;

    if (k <= 0) {
      return C_mAh / I_mA; // classic without self-discharge
    }

    // t = (1/k) * ln(1 + k*C/I)
    const t = (1 / k) * Math.log(1 + (k * C_mAh) / I_mA);
    return isFinite(t) && t > 0 ? t : 0;
  }, [capacity, selfDischarge, dischargeCurrent, mode, profile, profileStats]);

  const converted = useMemo(() => {
    const h = lifeHours;
    switch (timeFmt) {
      case 'Days': return h / 24;
      case 'Weeks': return h / (24 * 7);
      case 'Months': return h / (24 * 30);
      case 'Years': return h / (24 * 365);
      default: return h; // Hours
    }
  }, [lifeHours, timeFmt]);

  return (
    <div>
      <div class="grid cols-2">
        <div class="flex flex-col gap-4">
          <div class="grid cols-2">
            <Select
              label="Battery type"
              value={batteryType}
              onChange={(v) => {
                setBatteryType(v);
                if (v !== 'Custom') {
                  const m = batteries.find(m => m.name === v);
                  if (m) setCapacity(String(m.capacity));
                  if (m) setSelfDischarge(String(m.selfDischarge));
                  if (m) setNominalVoltage(String(m.nominalVoltage));
                  if (m) setContCurrent(String(m.maxContCurrent));
                  if (m) setPulseCurrent(String(m.maxPulseCurrent));
                }
              }}
              options={[
                ...batteries.map(m => ({ label: m.name, value: m.name })),
                { label: 'Custom', value: 'Custom' },
              ]}
            />

            <Input
              label="Capacity"
              value={capacity}
              onChange={setCapacity}
              suffix="mAh"
              placeholder="e.g. 36000"
              disabled={batteryType !== 'Custom'}
            />
            <Input
              label="Self Discharge"
              value={selfDischarge}
              onChange={setSelfDischarge}
              suffix="%/month"
              placeholder="e.g. 0.08"
              disabled={batteryType !== 'Custom'}
            />
            <Input
              label="Nominal Voltage"
              value={nominalVoltage}
              onChange={setNominalVoltage}
              suffix="V"
              placeholder="e.g. 3.6"
              disabled={batteryType !== 'Custom'}
            />
            <Input
              label="Max Continuous Current"
              value={maxContCurrent}
              onChange={setContCurrent}
              suffix="mA"
              placeholder="e.g. 450"
              disabled={batteryType !== 'Custom'}
            />
            <Input
              label="Max Pulse Current"
              value={maxPulseCurrent}
              onChange={setPulseCurrent}
              suffix="mA"
              placeholder="e.g. 1000"
              disabled={batteryType !== 'Custom'}
            />
          </div>
          <div class="grid cols-2">
            <Select
              label="Mode"
              value={mode}
              onChange={(v) => setMode(v as 'constant' | 'profile')}
              options={[
                { label: 'Constant current', value: 'constant' },
                { label: 'Profile', value: 'profile' },
              ]}
            />
            <Select
              label="Time Format"
              value={timeFmt}
              onChange={(v) => setTimeFmt(v as any)}
              options={[
                { label: 'Hours', value: 'Hours' },
                { label: 'Days', value: 'Days' },
                { label: 'Weeks', value: 'Weeks' },
                { label: 'Months', value: 'Months' },
                { label: 'Years', value: 'Years' },
              ]}
            />
          </div>

          {mode === 'constant' && (
            <div class="grid">
              <Input
                label="Discharge current"
                value={dischargeCurrent}
                onChange={setDischargeCurrent}
                placeholder="e.g. 100m"
                suffix="A"
              />
            </div>
          )}
        </div>
        <ResultCard rows={[
          { label: 'Battery Life', value: `${converted.toFixed(2)} ${timeFmt}` },
          ...(mode === 'profile' && profileStats ? [
            { label: 'Avg current (profile)', value: formatSI(profileStats.Ieq_A, 'A') },
            { label: 'Period', value: formatDuration(profileStats.period_s) },
          ] : []),
        ]} />
      </div>
      {mode === 'profile' && (
        <div class="grid">
          <CurrentProfile value={profile} onChange={setProfile} />
        </div>
      )}
    </div>
  );
}
