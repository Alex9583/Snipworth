interface LogoChipProps {
  readonly size?: number;
  readonly label?: string;
}

export function LogoChip({ size = 24, label }: LogoChipProps) {
  const width = Math.round(size * (40 / 32));
  const inner = Math.round(size * 0.78);
  const radius = Math.round(size * 0.26);
  return (
    <span
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      className="from-accent to-accent-2 inline-flex shrink-0 items-center justify-center bg-linear-to-br shadow-md"
      style={{ width, height: size, borderRadius: radius }}
    >
      <LogoMark size={inner} />
    </span>
  );
}

function LogoMark({ size }: { readonly size: number }) {
  return (
    <svg
      width={(size * 40) / 32}
      height={size}
      viewBox="0 0 40 32"
      fill="none"
      stroke="#fff"
      strokeWidth={3.2}
      strokeLinecap="butt"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 6 L3 26" />
      <path d="M13 9 L7 16 L13 23" />
      <path d="M23 7 L17 25" />
      <path d="M27 9 L33 16 L27 23" />
      <path d="M37 6 L37 26" />
    </svg>
  );
}
