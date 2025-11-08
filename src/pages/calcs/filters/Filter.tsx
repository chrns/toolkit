import { useEffect, useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { RLCNetwork } from '@/pages/calcs/filters/tabs/RLCNetwork'
import { AttenuatorTab } from '@/pages/calcs/filters/tabs/AttenuatorTab';

type FilterTab = 'rlc' | 'attenuator';
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'rlc', label: 'RC/RL/LC' },
  { key: 'attenuator', label: 'Attenuator' },
];

function parseHash(): FilterTab {
  const h = (location.hash || '').replace(/^#/, '');
  return (TABS.some(t => t.key === h) ? h : 'rlc') as FilterTab;
}

export default function OhmsLaw() {
  const [tab, setTab] = useState<FilterTab>(() => parseHash());

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
    const key = t as FilterTab;
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
          {tab === 'rlc' && <RLCNetwork />}
          {tab === 'attenuator' && <AttenuatorTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
