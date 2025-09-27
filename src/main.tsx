import { render } from 'preact';
import { Router, Route } from 'wouter';
import { lazy, Suspense } from 'preact/compat';
import 'virtual:uno.css';
import '@/styles.css';
import { AppShell } from '@/ui/AppShell';

const Home = lazy(() => import('@/pages/Home'));
const OhmsLaw = lazy(() => import('@/pages/calcs/ohms/OhmsLaw'));
const Filter = lazy(() => import('@/pages/calcs/filters/Filter'));
const Pcb = lazy(() => import('@/pages/calcs/pcb/Pcb'));
const BatteryLife = lazy(() => import('@/pages/calcs/battery/BatteryLife'));
const MCU = lazy(() => import('@/pages/calcs/mcu/MCU'));
const Components = lazy(() => import('@/pages/calcs/components/Components'));

function Loading() { return <div class="p-4">Loading...</div>; }

(() => {
  try {
    const stored = localStorage.getItem('theme');
    const theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    (root as any).style.colorScheme = theme;
  } catch { }
})();

render(
  <Router>
    <AppShell>
      <Suspense fallback={<Loading />}>
        <Route path="/" component={Home} />
        <Route path="/ohms" component={OhmsLaw} />
        <Route path="/filter" component={Filter} />
        <Route path="/pcb" component={Pcb} />
        <Route path="/battery" component={BatteryLife} />
        <Route path="/mcu" component={MCU} />
        <Route path="/component" component={Components} />
      </Suspense>
    </AppShell>
  </Router>,
  document.getElementById('app')!
);