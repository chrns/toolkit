import { useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { BatteryLifeTab } from './tabs/BatteryLifeTab';
import { BatteryMetricsTab } from './tabs/BatteryMetricsTab';

export default function Battery() {
  const [tab, setTab] = useState('life');
  const tabs = [
    { key: 'life', label: 'Life' },
    { key: 'metrics', label: 'Metrics' },
  ];

  return (
    <div class="grid">
      <div class="flex flex-col gap-4">
        <TabbedPanel
          tabs={tabs}
          active={tab}
          onSelect={setTab}
        >
          {tab === 'life' && <BatteryLifeTab />}
          {tab === 'metrics' && <BatteryMetricsTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
