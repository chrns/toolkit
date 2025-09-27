import { useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import TimerTab from './tabs/Timer';
// import BusTab from './tabs/Bus';
// import GenTab from './tabs/GenTab';
// import MemroyTab from './tabs/Memroy';
import DFUTab from './tabs/DfuTab';
import CrcTab from './tabs/CrcTab';

export default function MCU() {
  // Sub-tabs
  const [tab, setTab] = useState('tim');
  const tabs = [
    { key: 'tim', label: 'Timer' },
    // { key: 'bus', label: 'Bus' },
    // { key: 'mem', label: 'Memory' },
    { key: 'dfu', label: 'DFU' },
    // { key: 'gen', label: 'Generators' },
    { key: 'crc', label: 'CRC' },
  ];
  return (
    <div class="grid">
      <div class="flex flex-col gap-4">
        <TabbedPanel
          tabs={tabs}
          active={tab}
          onSelect={setTab}
        >
          {tab === 'tim' && <TimerTab />}
          {/* {tab === 'bus' && <BusTab />}
          {tab === 'mem' && <MemroyTab />} */}
          {tab === 'dfu' && <DFUTab />}
          {/* {tab === 'gen' && <GenTab />} */}
          {tab === 'crc' && <CrcTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
