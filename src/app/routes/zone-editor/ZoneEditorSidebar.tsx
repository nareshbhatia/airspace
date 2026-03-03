import { ZoneCard } from './ZoneCard';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../utils/cn';

import type { DrawnZone, ZoneType } from './types';

interface ZoneEditorSidebarProps {
  className?: string;
  zones: DrawnZone[];
  activeDrawType: ZoneType | null;
  selectedZoneId: string | null;
  onSelectType: (type: ZoneType) => void;
  onSelectZone: (zoneId: string) => void;
  onCancel: () => void;
  onDeleteZone: (zoneId: string) => void;
}

/**
 * Left sidebar for the Zone Editor: drawing mode toolbar and zone list.
 */
export function ZoneEditorSidebar({
  className,
  zones,
  activeDrawType,
  selectedZoneId,
  onSelectType,
  onSelectZone,
  onCancel,
  onDeleteZone,
}: ZoneEditorSidebarProps) {
  return (
    <aside
      className={cn(
        'flex w-[300px] shrink-0 flex-col border-r border-border bg-background',
        className,
      )}
    >
      <div className="border-b border-border px-3 py-3">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={
              activeDrawType === 'mission-boundary' ? 'default' : 'outline'
            }
            className="w-full justify-start"
            onClick={() => onSelectType('mission-boundary')}
          >
            Mission Boundary
          </Button>
          <Button
            type="button"
            variant={activeDrawType === 'no-fly-zone' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => onSelectType('no-fly-zone')}
          >
            No-Fly Zone
          </Button>
          <Button
            type="button"
            variant={
              activeDrawType === 'restricted-airspace' ? 'default' : 'outline'
            }
            className="w-full justify-start"
            onClick={() => onSelectType('restricted-airspace')}
          >
            Restricted Airspace
          </Button>
          {activeDrawType !== null && (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="border-b border-border px-3 py-2 text-sm font-medium">
          Zones
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Select a zone type above to start drawing.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {zones.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  isSelected={zone.id === selectedZoneId}
                  onSelect={() => onSelectZone(zone.id)}
                  onDelete={onDeleteZone}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
