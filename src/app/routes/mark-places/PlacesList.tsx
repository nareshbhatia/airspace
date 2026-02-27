import { Trash2 } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from '../../../components/ui/card';
import { cn } from '../../../utils/cn';

import type { Place } from './types/Place';

interface PlacesListProps {
  places: Place[];
  selectedPlaceId?: string;
  onPlaceSelected: (placeId: string) => void;
  onPlaceDeleted: (placeId: string) => void;
}

export function PlacesList({
  places,
  selectedPlaceId,
  onPlaceSelected,
  onPlaceDeleted,
}: PlacesListProps) {
  if (places.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Click on the map to add places.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {places.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        const coords = `${place.coordinates.lng.toFixed(4)}, ${place.coordinates.lat.toFixed(4)}`;
        return (
          <li key={place.id}>
            <Card
              size="sm"
              className={cn(
                'cursor-pointer transition-shadow',
                isSelected && 'ring-2 ring-primary',
              )}
              role="button"
              tabIndex={0}
              onClick={() => onPlaceSelected(place.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPlaceSelected(place.id);
                }
              }}
            >
              <CardHeader>
                <CardDescription>{coords}</CardDescription>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:text-destructive"
                    aria-label="Delete place"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaceDeleted(place.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
