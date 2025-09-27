import { useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { OhmsLawTab } from './tabs/OhmsLawTab'
import { LedTab } from './tabs/LedTab';
import { RLCTab } from './tabs/RLCTab';
import { DividerTab } from './tabs/DividerTab';

export default function OhmsLaw() {
  const [tab, setTab] = useState('ohms');
  const tabs = [
    { key: 'ohms', label: 'Ohm\'s' },
    { key: 'divider', label: 'Divider' },
    { key: 'led', label: 'LED' },
    { key: 'rlc', label: 'R, L, C' },
  ];

  return (
    <div class="grid">
      <div class="flex flex-col gap-4">
        <TabbedPanel
          tabs={tabs}
          active={tab}
          onSelect={setTab}
        >
          {tab === 'ohms' && <OhmsLawTab />}
          {tab === 'divider' && <DividerTab />}
          {tab === 'led' && <LedTab />}
          {tab === 'rlc' && <RLCTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
