import { cn } from '../../utils/cn';
import { severityToColor } from '../../utils/severityToColor';

import type { Severity } from '../../types/Severity';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface MetricDisplayProps {
  label?: string;
  value: ReactNode;
  unit?: string;
  icon?: LucideIcon;
  severity?: Severity;
  className?: string;
}

export function MetricDisplay({
  label,
  value,
  unit,
  icon: Icon,
  severity = 'info',
  className,
}: MetricDisplayProps) {
  const colors = severityToColor(severity);

  return (
    <div className={cn('flex flex-col gap-1 px-4', className)}>
      {label && <span className="text-muted-foreground text-xs">{label}</span>}
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn('w-4 h-4', colors.text)} />}
        <div className="flex items-baseline gap-1.5">
          <span className={cn('font-mono text-lg', colors.text)}>{value}</span>
          {unit && (
            <span className={cn('text-xs', colors.textMuted)}>{unit}</span>
          )}
        </div>
      </div>
    </div>
  );
}
