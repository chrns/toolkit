import { useLocation } from 'wouter';

export function CardButton(
  props: { href: string; label: string; children: preact.ComponentChildren }
) {
  const [, setLoc] = useLocation();
  return (
    <button class="card" onClick={() => setLoc(props.href)} aria-label={props.label}>
      <div class="card-icon">{props.children}</div>
      <div class="card-label">{props.label}</div>
    </button>
  );
}