import type { Accent } from '../types/Accent';

/**
 * Color mappings for a specific accent.
 * Usage:
 * 1. `text` should be used on a default background, e.g. `bg-background`
 * 2. `textMuted` should be used on a default background, e.g. `bg-background`
 * 3. `textContrast` should only be used on `bgContrast`
 */
export interface AccentColors {
  text: string;
  textMuted: string;
  textContrast: string;
  bgContrast: string;
}

/**
 * Maps accent values to AccentColors.
 * Uses semantic color classes from globals.css (--color-{accent}, --color-{accent}-foreground).
 */
const ACCENT_COLOR_MAP: Record<Accent, AccentColors> = {
  neutral: {
    text: 'text-foreground',
    textMuted: 'text-muted-foreground',
    textContrast: 'text-neutral-foreground',
    bgContrast: 'bg-neutral',
  },
  amber: {
    text: 'text-amber',
    textMuted: 'text-amber/70',
    textContrast: 'text-amber-foreground',
    bgContrast: 'bg-amber',
  },
  blue: {
    text: 'text-blue',
    textMuted: 'text-blue/70',
    textContrast: 'text-blue-foreground',
    bgContrast: 'bg-blue',
  },
  cyan: {
    text: 'text-cyan',
    textMuted: 'text-cyan/70',
    textContrast: 'text-cyan-foreground',
    bgContrast: 'bg-cyan',
  },
  emerald: {
    text: 'text-emerald',
    textMuted: 'text-emerald/70',
    textContrast: 'text-emerald-foreground',
    bgContrast: 'bg-emerald',
  },
  fuchsia: {
    text: 'text-fuchsia',
    textMuted: 'text-fuchsia/70',
    textContrast: 'text-fuchsia-foreground',
    bgContrast: 'bg-fuchsia',
  },
  green: {
    text: 'text-green',
    textMuted: 'text-green/70',
    textContrast: 'text-green-foreground',
    bgContrast: 'bg-green',
  },
  indigo: {
    text: 'text-indigo',
    textMuted: 'text-indigo/70',
    textContrast: 'text-indigo-foreground',
    bgContrast: 'bg-indigo',
  },
  lime: {
    text: 'text-lime',
    textMuted: 'text-lime/70',
    textContrast: 'text-lime-foreground',
    bgContrast: 'bg-lime',
  },
  orange: {
    text: 'text-orange',
    textMuted: 'text-orange/70',
    textContrast: 'text-orange-foreground',
    bgContrast: 'bg-orange',
  },
  pink: {
    text: 'text-pink',
    textMuted: 'text-pink/70',
    textContrast: 'text-pink-foreground',
    bgContrast: 'bg-pink',
  },
  purple: {
    text: 'text-purple',
    textMuted: 'text-purple/70',
    textContrast: 'text-purple-foreground',
    bgContrast: 'bg-purple',
  },
  red: {
    text: 'text-red',
    textMuted: 'text-red/70',
    textContrast: 'text-red-foreground',
    bgContrast: 'bg-red',
  },
  rose: {
    text: 'text-rose',
    textMuted: 'text-rose/70',
    textContrast: 'text-rose-foreground',
    bgContrast: 'bg-rose',
  },
  sky: {
    text: 'text-sky',
    textMuted: 'text-sky/70',
    textContrast: 'text-sky-foreground',
    bgContrast: 'bg-sky',
  },
  teal: {
    text: 'text-teal',
    textMuted: 'text-teal/70',
    textContrast: 'text-teal-foreground',
    bgContrast: 'bg-teal',
  },
  violet: {
    text: 'text-violet',
    textMuted: 'text-violet/70',
    textContrast: 'text-violet-foreground',
    bgContrast: 'bg-violet',
  },
  yellow: {
    text: 'text-yellow',
    textMuted: 'text-yellow/70',
    textContrast: 'text-yellow-foreground',
    bgContrast: 'bg-yellow',
  },
};

/**
 * Maps an accent to corresponding color classes.
 *
 * @param accent - The accent value
 * @returns An object containing text, textMuted, textContrast, and bgContrast color classes
 */
export function accentToColor(accent: Accent): AccentColors {
  return ACCENT_COLOR_MAP[accent];
}
