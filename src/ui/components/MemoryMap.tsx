import { useMemo, useState, useEffect } from 'preact/hooks';

export type SectorType = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
export type SectorDef = {
  sectorCount: string;
  sectorSize: string;
  sectorType: SectorType;
};

export function MemoryMap(props: {
  sectors: SectorDef[];
  startAddress: string;
  label?: string;
}) {
  const { sectors, startAddress, label } = props;

  function parseAddrHex(s: string): number {
    const t = (s || '').trim();
    if (/^0x[0-9a-fA-F]+$/.test(t)) return parseInt(t.slice(2), 16) >>> 0;
    if (/^[0-9a-fA-F]+$/.test(t)) return parseInt(t, 16) >>> 0;
    if (/^[0-9]+$/.test(t)) return (parseInt(t, 10) >>> 0) || 0;
    return 0;
  }
  function fmtHex32(n: number): string {
    const u = n >>> 0;
    return '0x' + u.toString(16).toUpperCase().padStart(8, '0');
  }
  function hexizeAddr8(addr: string): string {
    const t = (addr || '').trim();
    let v: number | null = null;
    if (/^0x[0-9a-fA-F]+$/.test(t)) v = parseInt(t.slice(2), 16);
    else if (/^[0-9a-fA-F]+$/.test(t)) v = parseInt(t, 16);
    else if (/^[0-9]+$/.test(t)) v = parseInt(t, 10);
    if (!Number.isFinite(v as number)) return '0x00000000';
    const n = (v as number) >>> 0;
    return '0x' + n.toString(16).toUpperCase().padStart(8, '0');
  }
  function pad2(s: string | number) { return String(s).padStart(2, '0'); }
  function pad3(s: string | number) { return String(s).padStart(3, '0'); }
  function segToken(seg: any): string {
    const cntRaw = (seg.sectorCount ?? seg.count ?? '0');
    const cnt = Math.max(0, Math.min(99, parseInt(String(cntRaw).trim(), 10) || 0));

    let sizeNum = 0, unit = 'K';
    if (seg.sectorSize) {
      const m = String(seg.sectorSize).trim().match(/^(\d{1,3})([BKMbkm])$/);
      if (m) { sizeNum = parseInt(m[1], 10); unit = m[2].toUpperCase(); }
    } else if (seg.size && seg.unit) {
      sizeNum = parseInt(String(seg.size).trim(), 10) || 0;
      unit = String(seg.unit).trim().toUpperCase();
    }
    const type = String(seg.sectorType ?? seg.type ?? 'a').toLowerCase();
    return `${pad2(cnt)}*${pad3(sizeNum)}${unit}${type}`;
  }
  function parseSizeToKB(sizeToken: string): number {
    const m = (sizeToken || '').trim().match(/^(\d{1,3})([BKMbkm])$/);
    if (!m) return 0;
    const val = parseInt(m[1], 10);
    const unit = m[2].toUpperCase();
    if (unit === 'M') return val * 1024;
    if (unit === 'K') return val;
    return val / 1024;
  }

  type DrawGroup = { idx: number; count: number; unitKB: number; sizeKB: number; type: SectorType; startKB: number; startAddr: number; endAddr: number };

  const model = useMemo(() => {
    const baseAddr = parseAddrHex(startAddress);

    const groups: DrawGroup[] = [];
    let accKB = 0;

    for (let i = 0; i < sectors.length; i++) {
      const g: any = sectors[i];
      const cntStr: string = (g.sectorCount ?? g.count ?? '0');
      const sizeTok: string = (g.sectorSize ?? (g.size && g.unit ? `${g.size}${g.unit}` : '0K'));
      const typeLetter: SectorType = (g.sectorType ?? g.type ?? 'a') as SectorType;

      const cnt = Math.max(0, Math.min(99, parseInt(String(cntStr).trim(), 10) || 0));
      const unitKB = parseSizeToKB(String(sizeTok));
      const sizeKB = cnt * unitKB;

      const startKB = accKB;
      const startAddr = baseAddr + Math.round(startKB * 1024);
      const endAddr = startAddr + Math.round(sizeKB * 1024) - 1;
      groups.push({ idx: groups.length, count: cnt, unitKB, sizeKB, type: typeLetter, startKB, startAddr, endAddr });
      accKB += sizeKB;
    }

    const totalKB = accKB;
    return { groups, totalKB, baseAddr };
  }, [sectors, startAddress]);

  const descriptor = useMemo(() => {
    const nm = (label && label.trim().length) ? label.trim() : 'Target';
    const addr = hexizeAddr8(startAddress);
    const segs = sectors.map(segToken).join(',');
    return `@${nm}/${addr}/${segs}`;
  }, [label, startAddress, sectors]);

  const defaultHint = useMemo(() => {
    if (model.groups.length === 0) return '';
    const g = model.groups[0];
    const rights = rightsFromType(g.type);
    return `[${fmtHex32(g.startAddr)} - ${fmtHex32(g.endAddr)}] — ${g.sizeKB.toFixed(3)} KB (${g.count}×${g.unitKB.toFixed(3)} KB) — ${rights}`;
  }, [model]);

  const [hint, setHint] = useState(defaultHint);

  useEffect(() => {
    setHint(defaultHint);
  }, [defaultHint]);

  function rightsFromType(t: SectorType): string {
    const R = t === 'a' || t === 'c' || t === 'e' || t === 'g';
    const W = t === 'd' || t === 'e' || t === 'f' || t === 'g';
    const E = t === 'b' || t === 'c' || t === 'f' || t === 'g';
    const parts: string[] = [];
    if (R) parts.push('R');
    if (W) parts.push('W');
    if (E) parts.push('E');
    return parts.join('/');
  }

  const bar = useMemo(() => {
    const { groups, totalKB } = model as { groups: DrawGroup[]; totalKB: number };
    if (totalKB <= 0) return (<div class="mm-bar ok" />);

    return (
      <div class="mm-bar ok">
        {groups.map((g: DrawGroup, i: number) => {
          const pct = (g.sizeKB / totalKB) * 100;
          const style = { width: pct + '%' } as any;
          const cls = `mm-chunk type-${g.type}`;
          const rights = rightsFromType(g.type);
          const title = `${fmtHex32(g.startAddr)} - ${fmtHex32(g.endAddr)}  |  ${g.sizeKB} KB  (${g.count} × ${g.unitKB.toFixed(3)} KB)  |  ${rights}`;
          const hintText = `[${fmtHex32(g.startAddr)} - ${fmtHex32(g.endAddr)}] — ${g.sizeKB} KB (${g.count}×${g.unitKB.toFixed(3)} KB) — ${rights}`;
          return (
            <div
              key={i}
              class={cls}
              style={style}
              title={title}
              onClick={() => setHint(hintText)}
            />
          );
        })}
      </div>
    );
  }, [model]);

  return (
    <div class="memory-map">
      <div class="mm-title">{descriptor}</div>
      <div class="mm-scale">
        <div class="mm-scale-left">0</div>
        <div class="mm-scale-right">{Math.max(0, Math.round(model.totalKB))}</div>
      </div>
      {bar}
      <div class="mm-legend">
        <span class="lg lg-a">Readable</span>
        <span class="lg lg-b">Erasable</span>
        <span class="lg lg-c">Read+Erase</span>
        <span class="lg lg-e">Read+Write</span>
        <span class="lg lg-f">Erase+Write</span>
        <span class="lg lg-g">R+E+W</span>
      </div>
      <div class="mm-hint" aria-live="polite">{hint}</div>
    </div>
  );
}

export default MemoryMap;
