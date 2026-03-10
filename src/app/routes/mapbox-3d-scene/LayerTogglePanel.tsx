import { useCallback, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { useMap } from '../../../lib/mapbox/hooks/useMap';
import { toggleLayer } from '../../../lib/mapbox/utils/scene3d';
import { cn } from '../../../utils/cn';

export interface LayerGroupConfig {
  id: string;
  label: string;
  layerIds: string[];
}

interface LayerTogglePanelProps {
  layerGroups: LayerGroupConfig[];
  className?: string;
}

/**
 * Overlay panel with checkboxes to show/hide each layer group on the map.
 * Must be used inside a MapProvider. Each checkbox toggles visibility for all
 * layers in that group via setLayoutProperty('visibility').
 */
export function LayerTogglePanel({
  layerGroups,
  className,
}: LayerTogglePanelProps) {
  const { map } = useMap();
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(layerGroups.map((g) => [g.id, true])),
  );

  const handleChange = useCallback(
    (groupId: string, checked: boolean) => {
      if (!map) return;
      const group = layerGroups.find((g) => g.id === groupId);
      if (!group) return;
      for (const layerId of group.layerIds) {
        toggleLayer(map, layerId, checked);
      }
      setVisible((prev) => ({ ...prev, [groupId]: checked }));
    },
    [map, layerGroups],
  );

  const initialVisible = useMemo(
    () => Object.fromEntries(layerGroups.map((g) => [g.id, true])),
    [layerGroups],
  );

  if (!map) return null;

  return (
    <Card size="sm" className={cn('w-fit min-w-40', className)}>
      <CardHeader className="pb-2">
        <CardTitle>Layers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <ul
          className="flex flex-col gap-2"
          role="group"
          aria-label="Layer visibility"
        >
          {layerGroups.map((group) => (
            <li key={group.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`layer-toggle-${group.id}`}
                checked={visible[group.id] ?? initialVisible[group.id] ?? true}
                onChange={(e) => handleChange(group.id, e.target.checked)}
                className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label={`Toggle ${group.label}`}
              />
              <Label
                htmlFor={`layer-toggle-${group.id}`}
                className="cursor-pointer text-foreground font-normal"
              >
                {group.label}
              </Label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
