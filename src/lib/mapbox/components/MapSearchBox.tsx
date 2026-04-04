import { SearchBox } from '@mapbox/search-js-react';
import mapboxgl from 'mapbox-gl';

import { cn } from '../../../utils/cn';
import { useMap } from '../hooks/useMap';

import type { MarkerOptions } from 'mapbox-gl';
import type { ComponentProps } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export interface MapSearchBoxProps {
  className?: string;
  marker?: boolean | MarkerOptions;
  placeholder?: string;
  options?: ComponentProps<typeof SearchBox>['options'];
}

/**
 * Mapbox Search Box overlay: forward geocoding with fly-to on the map from
 * {@link MapProvider}. Renders nothing until the map and token are ready.
 */
export function MapSearchBox({
  className,
  marker = false,
  placeholder,
  options,
}: MapSearchBoxProps) {
  const { map } = useMap();

  if (!MAPBOX_TOKEN || !map) {
    return null;
  }

  const showMarker = Boolean(marker);

  return (
    <div
      className={cn(
        'pointer-events-auto absolute left-4 top-4 z-20 w-[min(100%-2rem,20rem)]',
        className,
      )}
    >
      <SearchBox
        accessToken={MAPBOX_TOKEN}
        map={map}
        marker={marker}
        {...(showMarker ? { mapboxgl } : {})}
        placeholder={placeholder}
        options={options}
      />
    </div>
  );
}
