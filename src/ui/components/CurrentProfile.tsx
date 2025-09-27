import { h } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

const SI: Record<string, number> = {
  y: 1e-24, z: 1e-21, a: 1e-18, f: 1e-15, p: 1e-12, n: 1e-9, u: 1e-6, µ: 1e-6, m: 1e-3,
  '': 1,
  k: 1e3, K: 1e3, M: 1e6, G: 1e9, T: 1e12,
};

function parseSI(v?: string | number, unit?: 'A' | 's'): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return isFinite(v) ? v : undefined;
  const s = v.trim();
  if (!s) return undefined;
  const unitRx = unit && unit !== 's' ? new RegExp(unit + '$', 'i') : undefined;
  const cleared = unitRx ? s.replace(unitRx, '') : s;
  const m = cleared.match(/^([+-]?[0-9]*\.?[0-9]+)\s*([a-zµ]*)?$/i);
  if (!m) return undefined;
  const num = parseFloat(m[1]);
  const suf = (m[2] || '').trim();
  if (unit === 's') {
    const sfx = suf.toLowerCase();
    if (sfx === '' || sfx === 's' || sfx === 'sec' || sfx === 'secs') return num;
    if (sfx === 'ms') return num * 1e-3;
    if (sfx === 'us' || sfx === 'µs') return num * 1e-6;
    if (sfx === 'ns') return num * 1e-9;
    if (sfx === 'min') return num * 60;
    if (sfx === 'h' || sfx === 'hr' || sfx === 'hrs') return num * 3600;
  }
  const mul = SI[suf] ?? undefined;
  if (mul == null) return undefined;
  return num * mul;
}

function formatSI(value: number, unit: 'A' | 's'): string {
  if (!isFinite(value)) return `0${unit}`;
  const abs = Math.abs(value);
  if (unit === 's') {
    if (abs >= 1) return `${value.toFixed(2)}s`;
    if (abs >= 1e-3) return `${(value * 1e3).toFixed(2)}ms`;
    if (abs >= 1e-6) return `${(value * 1e6).toFixed(2)}us`;
    if (abs >= 1e-9) return `${(value * 1e9).toFixed(2)}ns`;
    return `${value.toExponential(2)}s`;
  }
  if (abs >= 1) return `${value.toFixed(2)}A`;
  if (abs >= 1e-3) return `${(value * 1e3).toFixed(2)}mA`;
  if (abs >= 1e-6) return `${(value * 1e6).toFixed(2)}uA`;
  if (abs >= 1e-9) return `${(value * 1e9).toFixed(2)}nA`;
  return `${value.toExponential(2)}A`;
}

export type ProfileItem = {
  id: string;
  current: string;
  duration: string;
};

export type CurrentProfileProps = {
  value?: ProfileItem[];
  onChange?: (items: ProfileItem[]) => void;
};

export default function CurrentProfile({ value, onChange }: CurrentProfileProps) {
  const [items, setItems] = useState<ProfileItem[]>(() => value ?? []);
  const [editingNew, setEditingNew] = useState<{ current: string; duration: string } | null>(null);

  useEffect(() => { if (value) setItems(value); }, [value]);
  useEffect(() => { onChange?.(items); }, [items]);

  const addCard = () => {
    setEditingNew({ current: '10mA', duration: '10ms' });
  };

  const commitNew = () => {
    if (!editingNew) return;
    const cur = parseSI(editingNew.current, 'A');
    const dur = parseSI(editingNew.duration, 's');
    if (cur == null || dur == null) return; // simple validation
    const id = (typeof globalThis !== 'undefined' && (globalThis as any).crypto && (globalThis as any).crypto.randomUUID)
      ? (globalThis as any).crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    setItems(prev => [...prev, { id, ...editingNew }]);
    setEditingNew(null);
  };

  const cancelNew = () => setEditingNew(null);

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const update = (id: string, patch: Partial<ProfileItem>) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));

  const dragIndex = useRef<number | null>(null);
  const onDragStart = (idx: number) => (e: DragEvent) => {
    dragIndex.current = idx;
    e.dataTransfer?.setData('text/plain', String(idx));
    e.dataTransfer?.setDragImage?.(new Image(), 0, 0);
  };
  const onDragOver = (idx: number) => (e: DragEvent) => { e.preventDefault(); };
  const onDrop = (idx: number) => (e: DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from == null || from === idx) return;
    setItems(prev => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
  };

  const Row = (props: { item: ProfileItem; index: number }) => {
    const { item, index } = props;
    const [isEdit, setIsEdit] = useState(false);
    const [cur, setCur] = useState(item.current);
    const [dur, setDur] = useState(item.duration);

    useEffect(() => { if (!isEdit) { setCur(item.current); setDur(item.duration); } }, [item.current, item.duration, isEdit]);

    const curNum = parseSI(item.current, 'A') ?? 0;
    const durNum = parseSI(item.duration, 's') ?? 0;

    return (
      <div
        class="cp-row"
        draggable
        onDragStart={onDragStart(index) as any}
        onDragOver={onDragOver(index) as any}
        onDrop={onDrop(index) as any}
      >
        {isEdit ? (
          <div class="cp-edit">
            <input class="cp-input" value={cur} onInput={(e: any) => setCur(e.currentTarget.value)} placeholder="e.g. 10mA" />
            <input class="cp-input" value={dur} onInput={(e: any) => setDur(e.currentTarget.value)} placeholder="e.g. 10us" />
            <button class="cp-btn" onClick={() => { update(item.id, { current: cur, duration: dur }); setIsEdit(false); }}>Save</button>
            <button class="cp-btn ghost" onClick={() => setIsEdit(false)}>Cancel</button>
          </div>
        ) : (
          <div class="cp-view">
            <span class="cp-bullet" />
            <span class="cp-text">{`${formatSI(curNum, 'A')}@${formatSI(durNum, 's')}`}</span>
            <div class="cp-actions">
              <button class="icon-btn" title="Edit" onClick={() => setIsEdit(true)}>✏️</button>
              <button class="icon-btn" title="Delete" onClick={() => remove(item.id)}>🗑️</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div class="current-profile">
      <div class="cp-header">
        <button class="cp-add" onClick={addCard}>Add</button>
      </div>

      {editingNew && (
        <div class="cp-row new">
          <div class="cp-edit">
            <input class="cp-input" value={editingNew.current} onInput={(e: any) => setEditingNew({ ...editingNew, current: e.currentTarget.value })} placeholder="e.g. 10mA" />
            <input class="cp-input" value={editingNew.duration} onInput={(e: any) => setEditingNew({ ...editingNew, duration: e.currentTarget.value })} placeholder="e.g. 10us" />
            <button class="cp-btn" onClick={commitNew}>Add step</button>
            <button class="cp-btn ghost" onClick={cancelNew}>Cancel</button>
          </div>
        </div>
      )}

      <div class="cp-list">
        {items.length === 0 && <div class="cp-empty">No steps yet. Click <b>Add</b> to create one.</div>}
        {items.map((it, i) => (
          <Row key={it.id} item={it} index={i} />
        ))}
      </div>
    </div>
  );
}
