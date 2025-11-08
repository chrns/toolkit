import { useEffect, useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { LifeTab } from '@/pages/calcs/battery/tabs/LifeTab';
import { MetricsTab } from '@/pages/calcs/battery/tabs/MetricsTab';
import EsrTab from './tabs/EsrTab';

type BatteryTab = 'life' | 'metrics' | 'esr';
const TABS: { key: BatteryTab; label: string }[] = [
  { key: 'life', label: 'Life' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'esr', label: 'ESR' },
];

function parseHash(): BatteryTab {
  const h = (location.hash || '').replace(/^#/, '');
  return (TABS.some(t => t.key === h) ? h : 'life') as BatteryTab;
}

export default function Battery() {
  const [tab, setTab] = useState<BatteryTab>(() => parseHash());

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
    const key = t as BatteryTab;
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
          {tab === 'life' && <LifeTab />}
          {tab === 'metrics' && <MetricsTab />}
          {tab === 'esr' && <EsrTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
