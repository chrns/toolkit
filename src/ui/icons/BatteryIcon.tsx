export function BatteryIcon(props: preact.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 120 60"
      width="72"
      height="36"
      {...props}
    >
      {/* Battery body */}
      <rect x="5" y="10" width="100" height="40" rx="6" ry="6" fill="#1e88e5" stroke="#0d385d" strokeWidth="3" />
      {/* Battery terminal */}
      <rect x="105" y="20" width="10" height="20" fill="#0d385d" />
      {/* Positive and negative signs */}
      <text x="15" y="38" fontSize="24" fill="#fff" fontWeight="bold">-</text>
      <text x="85" y="38" fontSize="24" fill="#fff" fontWeight="bold">+</text>
    </svg>
  );
}