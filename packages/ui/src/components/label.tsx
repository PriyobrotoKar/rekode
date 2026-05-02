'use client';

import * as React from 'react';

import { cn } from '@rekode/ui/lib/utils';

function Label({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'label'> & {
  size?: 'sm' | 'default';
}) {
  return (
    <label
      data-slot="label"
      className={cn(
        'text-md-medium flex items-center gap-2 leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        {
          'text-xs': size === 'sm',
        },
        className,
      )}
      {...props}
    />
  );
}

export { Label };
