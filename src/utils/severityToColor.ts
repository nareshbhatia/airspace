import type { Severity } from '../types/Severity';

/**
 * Color mappings for a specific severity level.
 * Usage:
 * 1. `text` should be used on a default background, e.g. `bg-background`
 * 2. `textMuted` should be used on a default background, e.g. `bg-background`
 * 3. `textContrast` should only be used on `bgContrast`
 */
export interface SeverityColors {
  text: string;
  textMuted: string;
  textContrast: string;
  bgContrast: string;
}

/**
 * Maps severity levels to SeverityColors.
 */
const SEVERITY_COLOR_MAP: Record<Severity, SeverityColors> = {
  info: {
    text: 'text-foreground',
    textMuted: 'text-muted-foreground',
    textContrast: 'text-info-foreground',
    bgContrast: 'bg-info',
  },
  success: {
    text: 'text-success',
    textMuted: 'text-success/70',
    textContrast: 'text-success-foreground',
    bgContrast: 'bg-success',
  },
  warning: {
    text: 'text-warning',
    textMuted: 'text-warning/70',
    textContrast: 'text-warning-foreground',
    bgContrast: 'bg-warning',
  },
  error: {
    text: 'text-error',
    textMuted: 'text-error/70',
    textContrast: 'text-error-foreground',
    bgContrast: 'bg-error',
  },
};

/**
 * Maps a severity level to corresponding semantic color classes.
 *
 * @param severity - The severity level
 * @returns An object containing text, textMuted, bg, and border color classes
 */
export function severityToColor(severity: Severity): SeverityColors {
  return SEVERITY_COLOR_MAP[severity];
}
