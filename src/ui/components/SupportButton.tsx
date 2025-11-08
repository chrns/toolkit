import { SponsorIcon } from '@/ui/icons/SponsorIcon';

export function SupportButton(props: { href: string }) {
  return (
    <a
      class="button sponsor flex items-center"
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Support this project on GitHub Sponsors"
    >
      <SponsorIcon />
      <span></span>
    </a>
  );
}