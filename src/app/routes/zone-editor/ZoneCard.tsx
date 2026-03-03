import { useEffect, useRef } from 'react';

import { Trash2 } from 'lucide-react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardAction,
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

export interface ZoneCardProps {
  zone: DrawnZone;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (zoneId: string) => void;
}

/**
 * Card for a single zone in the Zone Editor sidebar list.
 * Shows type badge, area, vertex count, and delete button. Click selects; scrolls into view when selected.
 */
export function ZoneCard({
  zone,
  isSelected,
  onSelect,
  onDelete,
}: ZoneCardProps) {
  const selectedCardRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (isSelected && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <li
      ref={(el) => {
        if (isSelected) selectedCardRef.current = el;
        else if (selectedCardRef.current === el) selectedCardRef.current = null;
      }}
    >
      <Card
        size="sm"
        className={cn(
          'py-3 cursor-pointer transition-shadow',
          isSelected && 'ring-2 ring-primary',
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium">
            <Badge className={cn(getTypeBadgeClassName(zone.type))}>
              {getTypeLabel(zone.type)}
            </Badge>
          </CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-destructive hover:text-destructive"
              aria-label="Delete zone"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(zone.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="pt-0 text-muted-foreground">
          <p className="text-xs">
            {zone.areaSqKm.toFixed(2)} km² · {zone.vertexCount} vertices
          </p>
        </CardContent>
      </Card>
    </li>
  );
}
