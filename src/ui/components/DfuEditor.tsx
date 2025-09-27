import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { Select } from '@/ui/components/Select';
import type { SectorType } from '@/ui/components/MemoryMap';

function streq(a: any, b: any) {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return a === b; }
}

type InSeg =
  | { sectorCount: string; sectorSize: string; sectorType: SectorType }
  | { count: string; size: string; unit: 'B' | 'K' | 'M'; type: SectorType };

export type DfuEditorProps = {
  label?: string;
  startAddress?: string;
  sectors?: InSeg[];
  onChange?: (sectors: { sectorCount: string; sectorSize: string; sectorType: SectorType }[]) => void;
};

type Row = {
  count: string;
  sizeToken: string;
  type: SectorType;
  added: boolean;
};

function normalizeSizeToken(s: string): string {
  const m = (s || '').toUpperCase().match(/^(\d{0,3})([BKM]?)$/);
  if (!m) return '';
  const num = m[1] || '';
  let unit = m[2] || '';
  if (num && !unit) unit = '';
  return num + unit;
}

function toRows(initial?: InSeg[]): Row[] {
  const rows: Row[] = [];
  if (initial && initial.length) {
    for (const s of initial) {
      const count = (('sectorCount' in s) ? s.sectorCount : s.count) ?? '';
      const sizeToken = (('sectorSize' in s) ? s.sectorSize : `${s.size}${s.unit}`) ?? '';
      const type = (('sectorType' in s) ? s.sectorType : s.type) as SectorType;
      rows.push({ count, sizeToken, type, added: true });
    }
  }
  rows.push({ count: '', sizeToken: '', type: 'a', added: false });
  return rows;
}

function toOut(rows: Row[]) {
  return rows.filter(r => r.added && r.count && r.sizeToken).map(r => ({
    sectorCount: r.count,
    sectorSize: r.sizeToken,
    sectorType: r.type,
  }));
}

const typeOptions = [
  { value: 'a', label: 'R' },
  { value: 'b', label: 'E' },
  { value: 'c', label: 'R + E' },
  { value: 'e', label: 'R + W' },
  { value: 'f', label: 'E + W' },
  { value: 'g', label: 'R + E + W' },
];

export default function DfuEditor({ label, startAddress, sectors = [], onChange }: DfuEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => toRows(sectors));
  const lastEmittedRef = useRef<ReturnType<typeof toOut> | null>(null);
  const lastPropsRef = useRef<InSeg[] | null>(sectors || null);

  useEffect(() => {
    if (!streq(lastPropsRef.current, sectors)) {
      lastPropsRef.current = sectors ? JSON.parse(JSON.stringify(sectors)) : null;
      setRows(toRows(sectors));
    }
  }, [sectors]);

  const out = useMemo(() => toOut(rows), [rows]);
  useEffect(() => {
    if (!onChange) return;
    if (streq(lastEmittedRef.current, out)) return;
    lastEmittedRef.current = out ? JSON.parse(JSON.stringify(out)) : out;
    onChange(out);
  }, [onChange, out]);

  function patch(i: number, p: Partial<Row>) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...p } : r));
  }
  function add(i: number) {
    setRows(prev => {
      const next = prev.map((r, idx) => idx === i ? { ...r, added: true } : r);
      const last = next[next.length - 1];
      const hasAdderAtEnd = last && !last.added;
      return hasAdderAtEnd ? next : next.concat([{ count: '', sizeToken: '', type: 'a', added: false }]);
    });
  }
  function del(i: number) {
    setRows(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      const hasAdder = next.some(r => !r.added);
      return hasAdder ? next : next.concat([{ count: '', sizeToken: '', type: 'a', added: false }]);
    });
  }

  return (
    <div class="dfu-editor">
      {/* {label && <div class="head">{label}{startAddress ? ` — ${startAddress}` : ''}</div>} */}

      <div class="rows">
        {rows.map((r, i) => (
          <div class="row" key={i}>
            <Input
              label="Size"
              value={r.sizeToken}
              onChange={(v) => patch(i, { sizeToken: normalizeSizeToken(v) })}
              placeholder="16K"
            />
            <Input
              label="Count"
              value={r.count}
              onChange={(v) => patch(i, { count: (v.replace(/\D+/g, '').slice(0, 2)) })}
              placeholder="04"
            />
            <Select
              label="Type"
              value={r.type}
              onChange={(v) => patch(i, { type: (v as SectorType) })}
              options={typeOptions}
            />

            {r.added ? (
              <button class="back-btn" type="button" onClick={() => del(i)} title="Remove sector">
                🗑
              </button>
            ) : (
              <button class="back-btn" type="button" onClick={() => add(i)} title="Add sector">
                +
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}