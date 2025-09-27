export function OhmsLawIcon(props: preact.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 100 90"
      width={props.width ?? 72}
      height={props.height ?? 72}
      {...props}
    >
      <polygon
        points="50,5 95,85 5,85"
        fill="var(--icon-main-color)"
        stroke="var(--icon-stroke)"
        strokeWidth="3"
        rx="8"
      />
      {/* Dividing lines */}
      <line x1="20" y1="55" x2="80" y2="55" stroke="var(--icon-stroke)" strokeWidth="2" />
      <line x1="50" y1="55" x2="50" y2="85" stroke="var(--icon-stroke)" strokeWidth="2" />

      {/* Letters */}
      <text x="50" y="40" textAnchor="middle" fontSize="20" fill="var(--icon-text)" fontWeight="bold">V</text>
      <text x="30" y="75" textAnchor="middle" fontSize="20" fill="var(--icon-text)" fontWeight="bold">I</text>
      <text x="70" y="75" textAnchor="middle" fontSize="20" fill="var(--icon-text)" fontWeight="bold">R</text>
    </svg>
  );
}
