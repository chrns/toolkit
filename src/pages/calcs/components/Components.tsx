import { useEffect, useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { QuartzTab } from '@/pages/calcs/components/tabs/QuartzTab';
import { NTCTab } from '@/pages/calcs/components/tabs/NTCTab';
import { LDOTab } from '@/pages/calcs/components/tabs/LDOTab';
import { SmpsTab } from '@/pages/calcs/components/tabs/SmpsTab';

type ComponentsTab = 'ldo' | 'smps' | 'quartz' | 'ntc';
const TABS: { key: ComponentsTab; label: string }[] = [
  { key: 'ldo', label: 'LDO' },
  { key: 'smps', label: 'SMPS' },
  { key: 'quartz', label: 'Quartz' },
  { key: 'ntc', label: 'NTC' },
];

function parseHash(): ComponentsTab {
  const h = (location.hash || '').replace(/^#/, '');
  return (TABS.some(t => t.key === h) ? h : 'ldo') as ComponentsTab;
}

export default function OhmsLaw() {
  const [tab, setTab] = useState<ComponentsTab>(() => parseHash());

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
    const key = t as ComponentsTab;
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
          {tab === 'ldo' && <LDOTab />}
          {tab === 'smps' && <SmpsTab />}
          {tab === 'quartz' && <QuartzTab />}
          {tab === 'ntc' && <NTCTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
