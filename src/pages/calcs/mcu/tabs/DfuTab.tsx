import { useMemo, useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { MemoryMap, SectorType } from '@/ui/components/MemoryMap';
import DfuEditor from '@/ui/components/DfuEditor';

type Unit = 'B' | 'K' | 'M';
type SType = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

interface Segment { count: string; size: string; unit: Unit; type: SType; }
interface Zone { startAddr: string; segments: Segment[]; }

function parseSizeToken(tok: string): { size: string; unit: Unit } {
  const m = (tok || '').trim().toUpperCase().match(/^(\d{1,3})([BKM])$/);
  if (!m) return { size: '0', unit: 'K' };
  return { size: m[1], unit: m[2] as Unit };
}

export default function DFUTab() {
  // Model
  const [targetName, setTargetName] = useState('Internal Flash');
  const [startAddr, setStartAddr] = useState('0x08000000');
  const [zones, setZones] = useState<Zone[]>([
    {
      startAddr: '0x08000000', segments: [
        { count: '2', size: '16', unit: 'K' as Unit, type: 'a' as SType },
        { count: '6', size: '16', unit: 'K' as Unit, type: 'g' as SType }
      ]
    },
  ]);

  const memMaps = useMemo(() => {
    return zones.map((z) => {
      const sectors = z.segments.map(s => ({
        sectorCount: s.count,
        sectorSize: `${s.size}${s.unit}`,
        sectorType: s.type as SectorType,
      }));
      return { label: targetName, startAddress: z.startAddr, sectors };
    });
  }, [zones, targetName]);

  const typeOptions = [
    { value: 'a', label: 'a — Readable' },
    { value: 'b', label: 'b — Erasable' },
    { value: 'c', label: 'c — Readable + Erasable' },
    { value: 'd', label: 'd — Writeable' },
    { value: 'e', label: 'e — Readable + Writeable' },
    { value: 'f', label: 'f — Erasable + Writeable' },
    { value: 'g', label: 'g — Readable + Erasable + Writeable' },
  ];
  const unitOptions = [
    { value: 'B', label: 'B (bytes)' },
    { value: 'K', label: 'K (kilo)' },
    { value: 'M', label: 'M (mega)' },
  ];

  return (
    <div>
      <div class="grid cols-2">
        <Input label="Start address" value={startAddr} onChange={setStartAddr} placeholder="0x08000000" />
        <Input label="Target name" value={targetName} onChange={setTargetName} placeholder="Flash" />
      </div>

      <div class="maps">
        {zones.map((z, i) => {
          const sectors = z.segments.map(s => ({
            sectorCount: s.count,
            sectorSize: `${s.size}${s.unit}`,
            sectorType: s.type as SectorType,
          }));
          return (
            <div class="map" key={i}>
              <MemoryMap
                label={targetName}
                sectors={sectors}
                startAddress={z.startAddr}
              />
              <DfuEditor
                label={targetName}
                startAddress={z.startAddr}
                sectors={sectors}
                onChange={(list) => {
                  setZones(prev => prev.map((zone, zi) => {
                    if (zi !== i) return zone;
                    const nextSegs: Segment[] = list.map(s => {
                      const { size, unit } = parseSizeToken(s.sectorSize);
                      return { count: s.sectorCount, size, unit, type: s.sectorType as SType };
                    });
                    return { ...zone, segments: nextSegs };
                  }));
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
