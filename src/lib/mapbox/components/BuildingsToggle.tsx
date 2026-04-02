import { Field, FieldLabel } from '../../../components/ui/field';
import { Switch } from '../../../components/ui/switch';

interface BuildingsToggleProps {
  isBuildingsEnabled: boolean;
  onBuildingsEnabledChange: (isBuildingsEnabled: boolean) => void;
  className?: string;
}

export function BuildingsToggle({
  isBuildingsEnabled,
  onBuildingsEnabledChange,
  className,
}: BuildingsToggleProps) {
  return (
    <Field orientation="horizontal" className={className}>
      <FieldLabel htmlFor="buildings-switch">Buildings</FieldLabel>
      <Switch
        id="buildings-switch"
        checked={isBuildingsEnabled}
        onCheckedChange={onBuildingsEnabledChange}
      />
    </Field>
  );
}
