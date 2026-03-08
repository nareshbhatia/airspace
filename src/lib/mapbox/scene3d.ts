import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Adds the 3D buildings fill-extrusion layer to the map using the composite
 * source. Inserts the layer below the first symbol layer so labels and POIs
 * render on top. OSM building data is only present at zoom 14+.
 */
export function addBuildings(map: MapboxMap): void {
  const layers = map.getStyle().layers;
  const firstSymbolLayer = layers?.find(
    (l) =>
      l.type === 'symbol' &&
      (l.layout as Record<string, unknown>)?.['text-field'],
  );

  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#2a2a3e',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.75,
        'fill-extrusion-ambient-occlusion-intensity': 0.4,
        'fill-extrusion-ambient-occlusion-radius': 3,
      },
    },
    firstSymbolLayer?.id,
  );
}
