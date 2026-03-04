export const SeverityEnum = {
  Info: 'info',
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
} as const;

export type Severity = (typeof SeverityEnum)[keyof typeof SeverityEnum];
