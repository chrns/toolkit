export function MicrostripIcon(props: preact.ComponentProps<'svg'>) {
  return (
    <svg width='420' height='160'>
      {/* Ground plane */}
      <rect x='30' y='120' width='360' height='14' fill='#d5b357' />
      {/* Dielectric */}
      <rect x='30' y='68' width='360' height='52' fill='#007b19ff' />
      {/* Top copper trace */}
      <rect x='160' y='52' width='120' height='16' fill='#d5b357' />
      {/* epsilon r label */}
      <text x='210' y='100' fill='white' font-size='28' font-family='serif' font-style='italic'>ε r</text>
      {/* t label and thickness cue */}
      <text x='135' y='60' fill='#1e88e5' font-size='22' font-family='serif' font-style='italic'>t</text>
      <path d='M150 52  l-6 -10 12 0 z' fill='#1e88e5' />
      <path d='M150 66  l-6 10 12 0 z' fill='#1e88e5' />
      <line x1='150' y1='50' x2='150' y2='68' stroke='#1e88e5' stroke-width='2' />
      {/* W arrows above the trace */}
      <text x='210' y='38' fill='#1e88e5' font-size='24' font-family='serif' font-style='italic'>W</text>
      <path d='M270 36  l12 6 -12 6 z' fill='#1e88e5' />
      <path d='M170 36 l-12 6 12 6 z' fill='#1e88e5' />
      <line x1='160' y1='42' x2='270' y2='42' stroke='#1e88e5' stroke-width='2' />
      {/* h double arrow on the right */}
      ß<line x1='400' y1='68' x2='400' y2='120' stroke='#1e88e5' stroke-width='2' />
      <path d='M400 68 l-6 10 12 0 z' fill='#1e88e5' />
      <path d='M400 120 l-6 -10 12 0 z' fill='#1e88e5' />
      <text x='405' y='100' fill='#1e88e5' font-size='26' font-family='serif' font-style='italic'>h</text>
    </svg>
  );
}