import { SponsorIcon } from '@/ui/icons/SponsorIcon';

export function SupportButton(props: { href: string }) {
  return (
    <a
      class="button sponsor flex items-center gap-2"
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Support this project on GitHub Sponsors"
    >
      <SponsorIcon />
      <span>Sponsor</span>
    </a>
  );
}