import { Field, FieldLabel } from '../../../components/ui/field';
import { Switch } from '../../../components/ui/switch';

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
      <FieldLabel className="shrink-0" htmlFor="map-view-3d-switch">
        Enable 3D
      </FieldLabel>
      <Switch
        id="map-view-3d-switch"
        checked={mode === '3d'}
        onCheckedChange={(checked) => onModeChange(checked ? '3d' : '2d')}
      />
    </Field>
  );
}
