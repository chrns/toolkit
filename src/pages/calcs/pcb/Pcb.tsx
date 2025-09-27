import { useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { ImpedanceTab } from './tabs/Impedance'
import { TraceTab } from './tabs/TraceTab'
// import { ViasTab } from './tabs/ViasTab';

export default function Pcb() {
  const [tab, setTab] = useState('trace');
  return (
    <div class="grid">
      <div class="flex flex-col gap-4">
        <TabbedPanel
          tabs={[
            // { key: 'vias', label: 'Vias' },
            { key: 'trace', label: 'Trace' },
            { key: 'impedance', label: 'Impedance' },
          ]}
          active={tab}
          onSelect={setTab}
        >
          {/* {tab === 'vias' && <ViasTab />} */}
          {tab === 'trace' && <TraceTab />}
          {tab === 'impedance' && <ImpedanceTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
