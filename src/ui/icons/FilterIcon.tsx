export function FilterIcon(props: preact.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 256 256"
      width="72"
      height="72"
      {...props}
    >
      <rect fill="none" height="256" width="256" />
      <path d="M24,128c104-224,104,224,208,0Z" opacity="0.2" />
      <path d="M24,128c104-224,104,224,208,0" fill="var(--icon-main-color)" stroke="var(--icon-stroke)" stroke-linecap="round" stroke-linejoin="round" stroke-width="16" />
    </svg>
  );
}




