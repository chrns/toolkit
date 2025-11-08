import { useMemo, useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { Select } from '@/ui/components/Select';
import { ResultCard } from '@/ui/components/ResultCard';
import { parseSI } from '@/lib/si';

const TIMER_WIDTHS: Record<'16' | '32', { maxArr: number; maxPsc: number }> = {
  '16': { maxArr: 0xffff, maxPsc: 0xffff },
  '32': { maxArr: 0xffffffff, maxPsc: 0xffff },
};

type Mode = 'basic' | 'pwm';
type Looking = 'period' | 'freq';

export default function TimerTab() {
  const [mode, setMode] = useState<Mode>('basic');
  const [lookingFor, setLookingFor] = useState<Looking>('period');
  const [timResolution, setTimResolution] = useState<'16' | '32'>('16');
  const [timClk, setTimClk] = useState('72M');
  const [targetFreq, setTargetFreq] = useState('1k');
  const [targetPeriod, setTargetPeriod] = useState('1m');
  const [dutyCycle, setDutyCycle] = useState('50');

  const tFreq = parseSI(targetFreq) ?? 0;
  const tPeriod = parseSI(targetPeriod) ?? 0;
  const tClk = parseSI(timClk) ?? 0;

  // Finding PSC and ARR
  const maxArr = TIMER_WIDTHS[timResolution].maxArr;
  const maxPsc = TIMER_WIDTHS[timResolution].maxPsc;

  // ---- Calculations ----
  const targetHz = useMemo(() => {
    if (lookingFor === 'freq') {
      return tFreq > 0 ? tFreq : 0;
    }
    // lookingFor === 'period'
    return tPeriod > 0 ? 1 / tPeriod : 0;
  }, [lookingFor, tFreq, tPeriod]);

  type Pick = { psc: number; arr: number; fout: number; err: number } | null;

  const bestPick: Pick = useMemo(() => {
    if (!(tClk > 0 && targetHz > 0)) return null;
    const N = tClk / targetHz; // desired total divider (PSC+1)*(ARR+1)
    let best: Pick = null;
    for (let psc = 0; psc <= maxPsc; psc++) {
      const arr = Math.round(N / (psc + 1)) - 1;
      if (arr < 0 || arr > maxArr) continue;
      const fout = tClk / ((psc + 1) * (arr + 1));
      const err = Math.abs(fout - targetHz);
      if (best === null || err < best.err) best = { psc, arr, fout, err };
    }
    return best;
  }, [tClk, targetHz, maxArr, maxPsc]);

  const duty = useMemo(() => {
    const d = Number(dutyCycle);
    if (!isFinite(d)) return 0;
    return Math.min(100, Math.max(0, d));
  }, [dutyCycle]);

  const crrPwm = useMemo(() => {
    if (!bestPick) return null;
    const { arr } = bestPick;
    const crr = Math.round(((arr + 1) * duty) / 100);
    return crr;
  }, [bestPick, duty]);

  return (
    <div class="grid cols-2">
      <div>
        <div>
          <div class="grid cols-2">
            <Select
              label="Mode"
              value={mode}
              onChange={(v: any) => setMode((v as Mode) || 'basic')}
              options={[
                { label: 'Base timer', value: 'basic' },
                { label: 'PWM', value: 'pwm' },
              ]}
            />
            <Select
              label="Timer resolution"
              value={timResolution}
              onChange={(v: any) => setTimResolution((v as '16' | '32') || '16')}
              options={[
                { label: '16 bits', value: '16' },
                { label: '32 bits', value: '32' },
              ]}
            />
          </div>
          <Input
            label={<>Timer clock, F<sub>clk</sub></>}
            value={timClk}
            onChange={setTimClk}
            suffix="Hz"
            placeholder="72M"
          />

          <Select
            label="Looking for"
            value={lookingFor}
            onChange={(v: any) => setLookingFor((v as Looking) || 'period')}
            options={[
              { label: 'Period', value: 'period' },
              { label: 'Frequency', value: 'freq' },
            ]}
          />
          {
            lookingFor == 'period' ?
              <Input
                label='Period'
                value={targetPeriod}
                onChange={setTargetPeriod}
                suffix="s"
                placeholder="1m"
              /> :
              <Input
                label='Frequency'
                value={targetFreq}
                onChange={setTargetFreq}
                suffix="Hz"
                placeholder="1k"
              />
          }
        </div>

        {mode === 'pwm' && (
          <Input
            label='Duty cycle'
            value={dutyCycle}
            onChange={setDutyCycle}
            suffix="%"
            placeholder="50"
          />
        )}
      </div>
      <ResultCard
        rows={
          bestPick
            ? (
              mode === 'pwm'
                ? [
                  { label: 'PSC', value: String(bestPick.psc) },
                  { label: 'ARR', value: String(bestPick.arr) },
                  { label: 'CRR', value: crrPwm !== null ? String(crrPwm) : '-' },
                ]
                : [
                  { label: 'PSC', value: String(bestPick.psc) },
                  { label: 'ARR', value: String(bestPick.arr) },
                  { label: 'CRR', value: '-' },
                ]
            )
            : [
              { label: 'PSC', value: '-' },
              { label: 'ARR', value: '-' },
              { label: 'CRR', value: mode === 'pwm' ? '-' : '-' },
            ]
        }
      />
    </div>
  );
}
