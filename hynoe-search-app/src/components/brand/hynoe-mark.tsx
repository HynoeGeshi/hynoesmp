type HynoeMarkProps = {
  variant?: 'core' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = { sm: 32, md: 44, lg: 64 } as const;

export function HynoeMark({ variant = 'core', size = 'md', className = '' }: HynoeMarkProps) {
  const pixels = sizeMap[size];

  if (variant === 'premium') {
    return (
      <img
        className={`hynoe-mark hynoe-mark--premium ${className}`.trim()}
        src="/brand/hynoe-premium-mark.png"
        width={Math.round(pixels * 1.5)}
        height={pixels}
        alt="HYNOE"
      />
    );
  }

  return (
    <svg
      className={`hynoe-mark hynoe-mark--core ${className}`.trim()}
      width={Math.round(pixels * 1.5)}
      height={pixels}
      viewBox="0 0 96 64"
      role="img"
      aria-label="HYNOE"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="48" cy="32" rx="44" ry="25" stroke="currentColor" strokeWidth="3" />
      <path d="M31 47V17L59 47V17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 47L54 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
