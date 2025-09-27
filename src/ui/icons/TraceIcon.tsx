export function TraceIcon(props: preact.ComponentProps<'svg'>) {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" {...props}>
      <g fill="none" stroke="#0d385d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="16" width="22" height="7" rx="1.5" fill="#1e88e5" stroke="#0d385d" strokeWidth="1" />
        <rect x="7" y="12.5" width="10" height="3" fill="#e5c71e" stroke="#0d385d" strokeWidth="1" />
      </g>
    </svg>
  );
}