import React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

type LogoVariant = 'mark' | 'white' | 'full';

interface LuvioLogoProps {
  variant?: LogoVariant;
  /** Pixel size for the mark (height). */
  size?: number;
  className?: string;
  /** Show wordmark next to the mark (ignored for variant="full" which is mark-only large). */
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Brand mark from `app/assets/logo` (also served via `/logo/*`).
 * - mark: gradient PNG icon
 * - white: white SVG (use on brand-gradient / dark surfaces)
 * - full: larger gradient mark for auth heroes
 */
export const LuvioLogo: React.FC<LuvioLogoProps> = ({
  variant = 'mark',
  size = 28,
  className,
  showWordmark = false,
  wordmarkClassName,
}) => {
  const src =
    variant === 'white' ? '/logo/logo-white.svg' : '/logo/logo-gradient.png';

  const mark = (
    <Image
      src={src}
      alt="Luvio"
      width={size}
      height={Math.round(size * (1148 / 1017))}
      className={cn('object-contain', className)}
      priority={variant === 'full'}
    />
  );

  if (!showWordmark) {
    return mark;
  }

  return (
    <span className="inline-flex items-center gap-2">
      {mark}
      <span
        className={cn(
          'font-title text-[17px] font-bold tracking-tight text-[#0C2A43] lowercase',
          wordmarkClassName
        )}
      >
        luvio
      </span>
    </span>
  );
};

/** White mark on brand gradient tile — best for light sidebars / headers. */
export const LuvioLogoBadge: React.FC<{
  size?: number;
  className?: string;
  iconSize?: number;
}> = ({ size = 28, className, iconSize }) => {
  const tile = size;
  const icon = iconSize ?? Math.round(size * 0.62);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg brand-gradient',
        className
      )}
      style={{ width: tile, height: tile }}
    >
      <Image
        src="/logo/logo-white.svg"
        alt=""
        width={icon}
        height={Math.round(icon * (958 / 827))}
        className="object-contain"
        aria-hidden
      />
    </span>
  );
};
