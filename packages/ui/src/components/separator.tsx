'use client';

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import { cn } from '@rekode/ui/lib/utils';

function Separator({ className, orientation = 'horizontal', ...props }: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch data-[orientation=horizontal]:h-px',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
