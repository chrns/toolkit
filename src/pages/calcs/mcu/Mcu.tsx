import { useEffect, useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import TimerTab from '@/pages/calcs/mcu/tabs/Timer';
import DFUTab from '@/pages/calcs/mcu/tabs/DfuTab';
import CrcTab from '@/pages/calcs/mcu/tabs/CrcTab';
import { AdcTab } from '@/pages/calcs/mcu/tabs/AdcTab';


type McuTab = 'tim' | 'adc' | 'dfu' | 'crc';
const TABS: { key: McuTab; label: string }[] = [
  { key: 'tim', label: 'Timer' },
  { key: 'adc', label: 'ADC' },
  { key: 'dfu', label: 'DFU' },
  { key: 'crc', label: 'CRC' },
];

function parseHash(): McuTab {
  const h = (location.hash || '').replace(/^#/, '');
  return (TABS.some(t => t.key === h) ? h : 'tim') as McuTab;
}

export default function Mcu() {
  // Sub-tabs
  const [tab, setTab] = useState<McuTab>(() => parseHash());

  useEffect(() => {
    const desired = `#${tab}`;
    if (location.hash !== desired) {
      const url = new URL(location.href);
      url.hash = desired;
      history.replaceState(null, '', url);
    }
  }, [tab]);

  useEffect(() => {
    const onHash = () => setTab(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleSelect = (t: string) => {
    const key = t as McuTab;
    if (TABS.some(tab => tab.key === key)) setTab(key);
  };

  return (
    <div class="grid">
      <div class="flex flex-col gap-4">
        <TabbedPanel
          tabs={TABS}
          active={tab}
          onSelect={handleSelect}
        >
          {tab === 'tim' && <TimerTab />}
          {tab === 'adc' && <AdcTab />}
          {tab === 'dfu' && <DFUTab />}
          {tab === 'crc' && <CrcTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
