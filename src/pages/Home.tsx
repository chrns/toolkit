import { CardButton } from '@/ui/components/CardButton';
import { OhmsLawIcon } from '@/ui/icons/OhmsIcon'
import { TraceIcon } from '@/ui/icons/TraceIcon';
import { BatteryIcon } from '@/ui/icons/BatteryIcon';
import { MicrocontrollerIcon } from '@/ui/icons/MicrocontrollerIcon';
import { FilterIcon } from '@/ui/icons/FilterIcon';
import { ComponentsIcon } from '@/ui/icons/ComponentsIcon';

export default function Home() {
  return (
    <div class="home-grid">
      <CardButton href="/ohms" label="Ohm's Law & Co.">
        <OhmsLawIcon />
      </CardButton>

      <CardButton href="/pcb" label="PCB">
        <TraceIcon />
      </CardButton>

      <CardButton href="/filter" label="Filters & Attenuators">
        <FilterIcon />
      </CardButton>

      <CardButton href="/battery" label="Battery Life">
        <BatteryIcon />
      </CardButton>

      <CardButton href="/mcu" label="MCU">
        <MicrocontrollerIcon />
      </CardButton>

      <CardButton href="/component" label="Components">
        <ComponentsIcon />
      </CardButton>
    </div>
  );
}