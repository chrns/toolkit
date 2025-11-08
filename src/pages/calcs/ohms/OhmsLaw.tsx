import { useEffect, useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { OhmsLawTab } from '@/pages/calcs/ohms/tabs/OhmsLawTab'
import { RmsTab } from '@/pages/calcs/ohms/tabs/RmsTab';
import { LedTab } from '@/pages/calcs/ohms/tabs/LedTab';
import { RLCTab } from '@/pages/calcs/ohms/tabs/RLCTab';
import { DividerTab } from '@/pages/calcs/ohms/tabs/DividerTab';
import { WheatstoneTab } from '@/pages/calcs/ohms/tabs/WheatstoneTab';

type OhmsTab = 'ohms' | 'rms' | 'divider' | 'led' | 'rlc' | 'wheatstone';
const TABS: { key: OhmsTab; label: string }[] = [
  { key: 'ohms', label: 'Ohm\'s' },
  { key: 'rms', label: 'RMS' },
  { key: 'divider', label: 'Divider' },
  { key: 'led', label: 'LED' },
  { key: 'rlc', label: 'R, L, C' },
  { key: 'wheatstone', label: 'Wheatstone' },
];

function parseHash(): OhmsTab {
  const h = (location.hash || '').replace(/^#/, '');
  return (TABS.some(t => t.key === h) ? h : 'ohms') as OhmsTab;
}

export default function OhmsLaw() {
  const [tab, setTab] = useState<OhmsTab>(() => parseHash());
  // const [tab, setTab] = useState('ohms');

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
    const key = t as OhmsTab;
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
          {tab === 'ohms' && <OhmsLawTab />}
          {tab === 'rms' && <RmsTab />}
          {tab === 'divider' && <DividerTab />}
          {tab === 'led' && <LedTab />}
          {tab === 'rlc' && <RLCTab />}
          {tab === 'wheatstone' && <WheatstoneTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
