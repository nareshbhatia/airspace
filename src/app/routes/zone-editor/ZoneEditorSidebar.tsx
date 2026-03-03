import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { cn } from '../../../utils/cn';

import type { DrawnZone, ZoneType } from './types';

/** Badge style per zone type (matches map colors). */
function getTypeBadgeClassName(type: ZoneType | null): string {
  switch (type) {
    case 'mission-boundary':
      return 'bg-[#2563eb] text-white border-transparent';
    case 'no-fly-zone':
      return 'bg-[#dc2626] text-white border-transparent';
    case 'restricted-airspace':
      return 'bg-[#f59e0b] text-white border-transparent';
    default:
      return 'bg-[#6b7280] text-white border-transparent';
  }
}

function getTypeLabel(type: ZoneType | null): string {
  switch (type) {
    case 'mission-boundary':
      return 'Mission Boundary';
    case 'no-fly-zone':
      return 'No-Fly Zone';
    case 'restricted-airspace':
      return 'Restricted Airspace';
    default:
      return 'Untyped';
  }
}

interface ZoneCardProps {
  zone: DrawnZone;
}

function ZoneCard({ zone }: ZoneCardProps) {
  return (
    <Card size="sm" className="py-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium">
          <Badge className={cn(getTypeBadgeClassName(zone.type))}>
            {getTypeLabel(zone.type)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-muted-foreground">
        <p className="text-xs">
          {zone.areaSqKm.toFixed(2)} km² · {zone.vertexCount} vertices
        </p>
      </CardContent>
    </Card>
  );
}

interface ZoneEditorSidebarProps {
  className?: string;
  zones: DrawnZone[];
  activeDrawType: ZoneType | null;
  onSelectType: (type: ZoneType) => void;
  onCancel: () => void;
}

/**
 * Left sidebar for the Zone Editor: drawing mode toolbar and zone list.
 */
export function ZoneEditorSidebar({
  className,
  zones,
  activeDrawType,
  onSelectType,
  onCancel,
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
                <li key={zone.id}>
                  <ZoneCard zone={zone} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
