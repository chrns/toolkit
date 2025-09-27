import { useLocation } from 'wouter';
import { ComponentChildren } from 'preact';
import { ThemeToggle } from '@/ui/components/ThemeToggle';
import { UpdateToast } from '@/ui/components/UpdateToast';
import { BackButtonIcon } from '@/ui/icons/BackButtonIcon';
import { SupportButton } from '@/ui/components/SupportButton';

export function AppShell(props: { children: ComponentChildren }) {
  const [loc, setLoc] = useLocation();

  const showBack = loc !== '/';

  return (
    <div>
      <UpdateToast />
      <header class="topbar">

        <div class="flex items-center gap-3">
          {showBack && (
            <button class="back-btn" aria-label="Back to home" onClick={() => setLoc('/')}>
              <BackButtonIcon />
            </button>
          )}
          <div class="brand">
            Toolkit
            <span class="badge badge-pill badge-primary badge-sup">{
              (() => {
                const ver = (typeof __APP_VERSION__ !== 'undefined'
                  ? __APP_VERSION__
                  : (import.meta as any).env?.VITE_APP_VERSION ?? 'dev');
                return /^v?\d/.test(ver) ? `v${ver.replace(/^v/, '')}` : ver;
              })()
            }</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <SupportButton href="https://github.com/sponsors/chrns" />
          <ThemeToggle />
        </div>
      </header>

      <div class="layout">
        <div class="content">{props.children}</div>
      </div>
      <div class="footer-center text-center flex flex-col items-center justify-center gap-1 py-4">
        {/* footer */}
      </div>
    </div>
  );
}