import { useEffect, useState } from 'preact/hooks';

function getLocalVersion(): string {
  try {
    const v = (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : (import.meta as any).env?.VITE_APP_VERSION) as string | undefined;
    return (v && String(v)) || 'dev';
  } catch {
    return 'dev';
  }
}

function isInstalledPWA(): boolean {
  // Chrome/Edge
  const standaloneMedia = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  // iOS Safari
  const iosStandalone = typeof navigator !== 'undefined' && (navigator as any).standalone === true;
  // Some Android cases
  const androidRef = typeof document !== 'undefined' && document.referrer && document.referrer.startsWith('android-app://');
  return !!(standaloneMedia || iosStandalone || androidRef);
}

async function fetchServerVersion(signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch('/version.txt', { cache: 'no-cache', redirect: 'follow', signal });
    if (!res.ok) return null;
    const txt = (await res.text()).trim();
    return txt || null;
  } catch {
    return null;
  }
}

export function UpdateToast() {
  const [visible, setVisible] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const localVersion = getLocalVersion();

  useEffect(() => {
    if (!isInstalledPWA()) return;

    const ctrl = new AbortController();
    const run = async () => {
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) return;
      const sv = await fetchServerVersion(ctrl.signal);
      if (!sv) return;
      setServerVersion(sv);

      const dismissedFor = (() => { try { return localStorage.getItem('updateToast.dismissedFor'); } catch { return null; } })();
      if (sv !== localVersion && sv !== dismissedFor) {
        setVisible(true);
      }
    };

    run();

    const onOnline = () => run();
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      ctrl.abort();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [localVersion]);

  if (!visible) return null;

  return (
    <div class="update-toast" role="status" aria-live="polite">
      <span>
        A new version is available {serverVersion ? `: ${serverVersion}` : ''}. Reinstall to update.
      </span>
      <button
        class="button ghost"
        aria-label="Dismiss update notice"
        onClick={() => {
          try { if (serverVersion) localStorage.setItem('updateToast.dismissedFor', serverVersion); } catch { }
          setVisible(false);
        }}
      >×</button>
    </div>
  );
}
