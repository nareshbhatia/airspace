import { cn } from '../../../utils/cn';

import type { ReactNode } from 'react';

interface MapPanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Generic dark map overlay panel for controls and status widgets.
 */
export function MapPanel({ children, className }: MapPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border border-border/70 bg-card/95 p-2 shadow-md backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
