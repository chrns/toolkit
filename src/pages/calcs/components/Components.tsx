import { useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { QuartzTab } from './tabs/QuartzTab';
import { NTCTab } from './tabs/NTCTab';
import { LDOTab } from './tabs/LDOTab';

export default function OhmsLaw() {
  const [tab, setTab] = useState('ldo');
  const tabs = [
    { key: 'ldo', label: 'LDO' },
    { key: 'quartz', label: 'Quartz' },
    { key: 'ntc', label: 'NTC' },
  ];

  return (
    <div class="grid">
      <div class="flex flex-col gap-4">
        <TabbedPanel
          tabs={tabs}
          active={tab}
          onSelect={setTab}
        >
          {tab === 'ldo' && <LDOTab />}
          {tab === 'quartz' && <QuartzTab />}
          {tab === 'ntc' && <NTCTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
