import { HynoeMark } from './hynoe-mark';

type HynoeWordmarkProps = {
  compact?: boolean;
  className?: string;
};

export function HynoeWordmark({ compact = false, className = '' }: HynoeWordmarkProps) {
  return (
    <span className={`hynoe-wordmark ${compact ? 'hynoe-wordmark--compact' : ''} ${className}`.trim()}>
      <HynoeMark size={compact ? 'sm' : 'md'} />
      {!compact && <span className="hynoe-wordmark__name">HYNOE</span>}
    </span>
  );
}
