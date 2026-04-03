import { Field, FieldLabel } from '../../../components/ui/field';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group';

import type { MapViewMode } from '../types/MapViewMode';

interface MapViewModeToggleProps {
  mode: MapViewMode;
  onModeChange: (mode: MapViewMode) => void;
  className?: string;
}

export function MapViewModeToggle({
  mode,
  onModeChange,
  className,
}: MapViewModeToggleProps) {
  return (
    <Field orientation="horizontal" className={className}>
      <FieldLabel className="shrink-0">View Mode</FieldLabel>
      <ToggleGroup
        multiple={false}
        value={[mode]}
        onValueChange={(values) => {
          const next = values[0];
          if (next === '2d' || next === '3d') {
            onModeChange(next);
          }
        }}
        variant="outline"
        size="sm"
        spacing={0}
        aria-label="Map view mode"
      >
        <ToggleGroupItem value="2d" aria-label="2D">
          2D
        </ToggleGroupItem>
        <ToggleGroupItem value="3d" aria-label="3D">
          3D
        </ToggleGroupItem>
      </ToggleGroup>
    </Field>
  );
}
