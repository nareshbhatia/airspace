import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { cn } from '../../../utils/cn';

import type { AirspaceScene } from '../types/AirspaceScene';

interface SceneSelectorProps {
  scenes: readonly AirspaceScene[];
  selectedScene: AirspaceScene;
  onSceneChange: (scene: AirspaceScene) => void;
  className?: string;
}

export function SceneSelector({
  scenes,
  selectedScene,
  onSceneChange,
  className,
}: SceneSelectorProps) {
  return (
    <Select
      value={selectedScene}
      onValueChange={(scene) => {
        if (scene != null) onSceneChange(scene);
      }}
      isItemEqualToValue={(a, b) => a.name === b.name}
      itemToStringLabel={(scene) => scene.name}
    >
      <SelectTrigger
        size="sm"
        className={cn('min-w-36', className)}
        aria-label="Scene"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {scenes.map((scene) => (
          <SelectItem key={scene.name} value={scene}>
            {scene.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
