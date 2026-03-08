import { cn } from '@rekode/ui/lib/utils';

import LogoIconSvg from '../assets/logo-icon.svg';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

function Logo({ className, iconClassName, textClassName, showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img src={LogoIconSvg} alt="Rekode logo" className={cn('h-8 w-8', iconClassName)} />
      {showText && (
        <span className={cn('font-heading text-foreground text-3xl tracking-wide', textClassName)}>
          Rekode
        </span>
      )}
    </div>
  );
}

export { Logo };
