import { useCallback, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Field, FieldLabel } from '../../../components/ui/field';
import { cn } from '../../../utils/cn';
import { useMap } from '../hooks/useMap';
import { toggleLayer } from '../utils/scene3d';

// A group of layers that can be toggled together
export interface LayerGroup {
  id: string;
  label: string;
  layerIds: string[];
}

interface LayerTogglePanelProps {
  layerGroups: LayerGroup[];
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

  // Handle checkbox change for a layer group
  const handleChange = useCallback(
    (groupId: string, checked: boolean) => {
      if (!map) return;

      const group = layerGroups.find((g) => g.id === groupId);
      if (!group) return;

      // Toggle each layer in the group
      for (const layerId of group.layerIds) {
        toggleLayer(map, layerId, checked);
      }

      // Update the visible state for the group
      setVisible((prev) => ({ ...prev, [groupId]: checked }));
    },
    [map, layerGroups],
  );

  if (!map) return null;

  // Match border radius of the card to the MapPanel
  return (
    <Card size="sm" className={cn('rounded-md', className)}>
      <CardHeader>
        <CardTitle>Layers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <ul
          className="flex flex-col gap-2"
          role="group"
          aria-label="Layer visibility"
        >
          {layerGroups.map((group) => (
            <li key={group.id}>
              <Field orientation="horizontal">
                <Checkbox
                  id={`layer-toggle-${group.id}`}
                  checked={visible[group.id]}
                  onCheckedChange={(checked) => handleChange(group.id, checked)}
                  aria-label={`Toggle ${group.label}`}
                />
                <FieldLabel
                  htmlFor={`layer-toggle-${group.id}`}
                  className="cursor-pointer text-foreground font-normal"
                >
                  {group.label}
                </FieldLabel>
              </Field>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
