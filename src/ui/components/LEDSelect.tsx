import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { parseSI } from '@/lib/si';

type Opt = {
  key: string; label: string; color: string;
  value: number;
  range: [number, number];
};

const OPTIONS: Opt[] = [
  { key: 'red', label: 'Red', color: '#ff2a2a', value: 2.0, range: [1.62, 2.03] },
  { key: 'yellow', label: 'Yellow', color: '#ffd400', value: 2.2, range: [2.10, 2.18] },
  { key: 'orange', label: 'Orange', color: '#ff7a00', value: 2.1, range: [2.03, 2.10] },
  { key: 'blue', label: 'Blue', color: '#2a6aff', value: 3.2, range: [2.48, 3.70] },
  { key: 'green', label: 'Green', color: '#00c853', value: 2.5, range: [1.90, 4.00] },
  { key: 'violet', label: 'Violet', color: '#8e24aa', value: 3.4, range: [2.76, 4.00] },
  { key: 'uv', label: 'UV', color: '#6b00ff', value: 3.5, range: [3.10, 4.40] },
  { key: 'white', label: 'White', color: '#e0e0e0', value: 3.3, range: [3.20, 3.60] },
];

const CUSTOM_KEY = 'custom';

export function LEDSelect(props: {
  label?: string;
  value: string;
  setValue: (v: string) => void;
}) {
  const { value, setValue } = props;
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const selectedKey = useMemo(() => {
    const v = parseSI(value) ?? NaN;
    const hit = OPTIONS.find(o => v == o.value);
    return hit?.key ?? CUSTOM_KEY;
  }, [value]);

  const selectedOpt = OPTIONS.find(o => o.key === selectedKey);

  function pick(opt: Opt | 'custom') {
    setOpen(false);
    if (opt === 'custom') return;
    setValue(opt.value.toString());
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(t)) {
        const pop = document.getElementById('vf-pop');
        if (pop && !pop.contains(t)) setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    addEventListener('mousedown', onDoc);
    addEventListener('keydown', onEsc);
    return () => { removeEventListener('mousedown', onDoc); removeEventListener('keydown', onEsc); };
  }, [open]);

  return (
    <div class="vf-combo">
      <span class="vf-label">{props.label ?? 'LED Voltage Drop'}</span>

      <button
        ref={btnRef}
        class="vf-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {selectedKey === CUSTOM_KEY ? (
          <span class="dot dot-gradient" aria-hidden="true" />
        ) : (
          <span class="dot" style={`background:${selectedOpt?.color}`} aria-hidden="true" />
        )}
        <span class="vf-text">
          {selectedKey === CUSTOM_KEY ? 'Custom' : selectedOpt?.label}
          <span class="vf-sub">
            {selectedKey === CUSTOM_KEY
              ? `${value || '—'} V`
              : `(${selectedOpt!.range[0]}–${selectedOpt!.range[1]} V)`}
          </span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" class="chev" aria-hidden="true">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      {open && (
        <div id="vf-pop" class="vf-pop" role="listbox">
          {OPTIONS.map(o => (
            <button
              key={o.key}
              role="option"
              aria-selected={selectedKey === o.key}
              class="vf-opt"
              onClick={() => pick(o)}
            >
              <span class="dot" style={`background:${o.color}`} aria-hidden="true" />
              <span class="vf-label">{o.label}</span>
              <span class="vf-range">({o.range[0]} – {o.range[1]} V)</span>
            </button>
          ))}
          <button
            role="option"
            aria-selected={selectedKey === CUSTOM_KEY}
            class="vf-opt"
            onClick={() => pick('custom')}
          >
            <span class="dot dot-gradient" aria-hidden="true" />
            <span class="vf-label">Custom</span>
            <span class="vf-range">{value || '—'} V</span>
          </button>
        </div>
      )}
    </div>
  );
}
