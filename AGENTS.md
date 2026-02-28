# Project Instructions

This project is the ground control station for
[Flightpath](https://github.com/flightpath-dev/flightpath). It uses gRPC to send
MAVLink commands to the Flightpath server and receive MAVLink messages from the
server.

## Reference Documentation

- [MAVLink Protocol Specification](https://mavlink.io/en/): Used to control the
  drone.
- [MAVLINK Common Message Set](https://mavlink.io/en/messages/common.html): Part
  of the above specification that contains a set of common messages and commands
  that should be implemented by MAVLink-compatible systems.
- [MAVLINK Common Message Set in XML format](https://github.com/mavlink/mavlink/blob/master/message_definitions/v1.0/common.xml):
  The common message set in a structured XML format. This is easier for
  programmatic understanding. Note that this set includes
  [standard.xml](https://github.com/mavlink/mavlink/blob/master/message_definitions/v1.0/standard.xml),
  which itself includes
  [minimal.xml](https://github.com/mavlink/mavlink/blob/master/message_definitions/v1.0/minimal.xml).
  For a full understanding of the protocol, it's important to understand all
  three.
- [PX4 implementation of MAVLink Specs](https://docs.px4.io/main/en/mavlink/standard_modes):
  This page from the PX4 Guide describes how PX4 implements the MAVLink
  protocol. Specifically look at
  [Other MAVLink Mode-changing Commands](https://docs.px4.io/main/en/mavlink/standard_modes#other-mavlink-mode-changing-commands)
  for a list of specific commands to change modes. These can be more convenient
  that just starting the mode, in particular when the message allows additional
  settings to be configured.
- [gomavlib](https://github.com/bluenviron/gomavlib): The Go library used by the
  Flightpath server to send MAVLink commands to the drone and receive MAVLink
  messages. Use these docs to understand the server capabilities. Especially,
  look at the
  [examples](https://github.com/bluenviron/gomavlib/tree/main/examples)
  directory to understand MAVLink workflows to achieve specific goals.

## Coding Style

- Use TypeScript for all new files
- Prefer `undefined` over `null` to represent the absence of a value. Use
  `undefined` consistently for unset, missing, or cleared state. Avoid mixing
  `null` and `undefined` for the same semantic purpose.
  - Exception – context: Use `null` as the argument to createContext() when
    there is no meaningful default. Reason: React docs recommend `null` for this
    case.
  - Exception – refs: Use null for ref initial values and when clearing
    ref.current (e.g. useRef<T>(null), ref.current = null). Reason: React uses
    null for DOM refs and the same convention for all refs keeps the rule
    simple.

### Coding Style for imports

Don't mix type imports with regular imports, separate them out.

Example:

```ts
// DON'T DO THIS
import {
  StatusIndicator,
  type StatusIndicatorColor,
} from '../StatusIndicator/StatusIndicator';

// DO THIS INSTEAD
import { StatusIndicator } from '../StatusIndicator/StatusIndicator';

import type { StatusIndicatorColor } from '../StatusIndicator/StatusIndicator';
```

### Coding Style for Enumerations

When creating enumerations in TypeScript, follow these rules:

1. **Enum naming**: Use the `Enum` suffix for the enum name (e.g., `IntentEnum`,
   `StatusEnum`)
2. **Enum keys**: Use PascalCase string literals as enum keys
3. **Enum values**: Use camelCase string literals as enum values
4. **Type alias**: Create a type alias using template literal types to extract
   the enum values
5. **Export both**: Export both the enum and the type alias
6. **Prefer type alias**: Prefer the use of type alias over the enum. The enum
   should primarily used for iteration only.

This pattern allows you to:

- Use the enum for type-safe comparisons: `if (value === IntentEnum.Neutral)`
- Use the type alias for function parameters and return types:
  `function getIntent(): Intent`
- Get autocomplete and type checking for all enum values

Example:

```ts
export enum SeverityEnum {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export type Severity = `${SeverityEnum}`;
```

### Coding Style for React Components

- **Use named functions** for components. Define the component as a named
  function (e.g. `function FlightCommandPanel(...)`) rather than a default
  export or anonymous function.
- **Define props in an interface** above the component, named
  `ComponentNameProps`.
- **Event handlers passed as props** should be named `onEventName`, e.g.
  `onTakeoff`.
- **Event handlers inside components** should be named `handleEventName`, e.g.
  `handleTakeoff`. They should be wrapped in `useCallback` when passing to child
  components to provide a stable reference.
- **Style with Tailwind**. Use the **semantic design tokens** from
  `packages/autopilot/src/styles/globals.css` (e.g. `bg-card`, `bg-background`,
  `text-foreground`) instead of raw Tailwind color utilities so theming and dark
  mode stay consistent.
- **Merge class names with the `cn` utility** (`utils/cn`). Pass base classes
  first and `className` last so callers can override:
  `cn('base classes', className)`.
- **Prefer Shadcn components** over raw HTML (e.g. use Shadcn `<Button>` instead
  of `<button>`, `<Separator>` instead of a custom divider).
- **Follow best practices and idiomatic constructs when writing custom
  components**: For example, many apps using the Shadcn library construct lists
  using `<ul>` and `<Card>`.

Example:

```tsx
interface FlightCommandPanelProps {
  className?: string;
  onTakeoff: (altitudeFt: number) => void;
}

/**
 * FlightCommandPanel component for controlling drone flight operations.
 */
function FlightCommandPanel({ className, onTakeoff }: FlightCommandPanelProps) {
  return (
    <div className={cn('flex flex-col bg-card rounded-lg py-2', className)}>
      <Button onClick={onTakeoff}>Takeoff</Button>
    </div>
  );
}
```
