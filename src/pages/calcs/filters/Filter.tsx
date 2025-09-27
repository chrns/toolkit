import { useState } from 'preact/hooks';
import { TabbedPanel } from '@/ui/components/TabbedPanel';
import { RLCNetwork } from './tabs/RLCNetwork'
// import { PiFilter } from './tabs/PiFilter';
// import { TFilter } from './tabs/TFilter';
import { AttenuatorTab } from './tabs/AttenuatorTab';
import { late } from 'zod';


export default function OhmsLaw() {
  const [tab, setTab] = useState('rlc_network');
  const tabs = [
    { key: 'rlc_network', label: 'RC/RL/LC' },
    // { key: 'pi_filter', label: 'Pi-filter' },
    // { key: 't_filter', label: 'T-filter' },
    { key: 'attenuator', label: 'Attenuator' }
  ];

  return (
    <div class="grid">
      <div class="flex flex-col gap-4">
        <TabbedPanel
          tabs={tabs}
          active={tab}
          onSelect={setTab}
        >
          {tab === 'rlc_network' && <RLCNetwork />}
          {/* {tab === 'pi_filter' && <PiFilter />}
          {tab === 't_filter' && <TFilter />} */}
          {tab === 'attenuator' && <AttenuatorTab />}
        </TabbedPanel>
      </div>
    </div>
  );
}
