import { Field, FieldLabel } from '../../../components/ui/field';
import { Switch } from '../../../components/ui/switch';

interface TerrainSwitchProps {
  isTerrainEnabled: boolean;
  onTerrainEnabledChange: (isTerrainEnabled: boolean) => void;
  className?: string;
}

export function TerrainSwitch({
  isTerrainEnabled,
  onTerrainEnabledChange,
  className,
}: TerrainSwitchProps) {
  return (
    <Field orientation="horizontal" className={className}>
      <FieldLabel htmlFor="terrain-switch">Terrain</FieldLabel>
      <Switch
        id="terrain-switch"
        checked={isTerrainEnabled}
        onCheckedChange={onTerrainEnabledChange}
      />
    </Field>
  );
}
