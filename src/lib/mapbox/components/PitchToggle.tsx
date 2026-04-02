import { Field, FieldLabel } from '../../../components/ui/field';
import { Switch } from '../../../components/ui/switch';

interface PitchToggleProps {
  is3dEnabled: boolean;
  on3dEnabledChange: (is3dEnabled: boolean) => void;
  className?: string;
}

export function PitchToggle({
  is3dEnabled,
  on3dEnabledChange,
  className,
}: PitchToggleProps) {
  return (
    <Field orientation="horizontal" className={className}>
      <FieldLabel htmlFor="enable-3d-switch">Enable 3D</FieldLabel>
      <Switch
        id="enable-3d-switch"
        checked={is3dEnabled}
        onCheckedChange={on3dEnabledChange}
      />
    </Field>
  );
}
