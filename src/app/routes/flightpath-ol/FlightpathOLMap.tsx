import { useEffect, useRef } from 'react';

import { Feature } from 'ol';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Style, Icon } from 'ol/style';
import View from 'ol/View';

import droneIconUrl from '../../../assets/airplane.svg?url';
import { airportById } from '../../../gen/airports';
import { useDroneStore } from '../../../stores/droneStore';
import { cn } from '../../../utils/cn';

import type { FeatureLike } from 'ol/Feature';

import 'ol/ol.css';

const BOS_COORDS = airportById.get('BOS')?.coordinates ?? {
  lng: -71.0079,
  lat: 42.36197,
};
const INITIAL_CENTER: [number, number] = [BOS_COORDS.lng, BOS_COORDS.lat];

/** CartoDB Dark Matter — free dark basemap (no API key). */
const CARTO_DARK_URL =
  'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png';

const ICON_ANCHOR: [number, number] = [0.5, 0.5];
const SELECTED_OPACITY = 1;
const UNSELECTED_OPACITY = 0.8;

/** Heading step (degrees) for style cache; reduces Style/Icon churn on render. */
const HEADING_CACHE_STEP_DEG = 10;

/**
 * Builds a layer style function that reuses cached Style objects keyed by
 * rounded heading and selection state. Avoids allocating new Style/Icon on
 * every render (OpenLayers best practice for performance).
 */
function createDroneStyle(iconUrl: string) {
  const cache: Record<string, Style> = {};
  return (feature: FeatureLike, resolution: number): Style => {
    const f = feature as Feature<Point>;
    const heading = (f.get('heading') as number) ?? 0;
    const selected = (f.get('selected') as boolean) ?? false;
    void resolution; // required by StyleFunction signature, unused
    const headingKey =
      Math.round(heading / HEADING_CACHE_STEP_DEG) * HEADING_CACHE_STEP_DEG;
    const key = `${headingKey}-${selected}`;
    let style = cache[key];
    if (!style) {
      style = new Style({
        image: new Icon({
          src: iconUrl,
          rotation: (headingKey * Math.PI) / 180,
          anchor: ICON_ANCHOR,
          opacity: selected ? SELECTED_OPACITY : UNSELECTED_OPACITY,
        }),
      });
      cache[key] = style;
    }
    return style;
  };
}

interface FlightpathOLMapProps {
  className?: string;
}

/**
 * OpenLayers map panel for the Flightpath (OL) page. Same functionality as the
 * Mapbox FlightpathMap: renders all drones from the drone store with the
 * airplane icon, rotated by heading. Selected drone full opacity, others
 * dimmed. Click on marker selects; click on map deselects. Pointer cursor on
 * hover over markers.
 */
export function FlightpathOLMap({ className }: FlightpathOLMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const droneSourceRef = useRef<VectorSource<Feature<Point>> | null>(null);

  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);
  const selectedDrone = selectedDroneId
    ? drones.get(selectedDroneId)
    : undefined;

  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

    const initialCenter = fromLonLat(INITIAL_CENTER);

    const tileLayer = new TileLayer({
      source: new XYZ({
        url: CARTO_DARK_URL,
        attributions:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }),
    });

    const droneSource = new VectorSource<Feature<Point>>();
    droneSourceRef.current = droneSource;

    const droneLayer = new VectorLayer({
      source: droneSource,
      style: createDroneStyle(droneIconUrl),
    });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [tileLayer, droneLayer],
      view: new View({
        center: initialCenter,
        zoom: 14,
      }),
    });

    map.on('click', (ev) => {
      const hit = map.forEachFeatureAtPixel(ev.pixel, (feature) => feature);
      if (hit instanceof Feature) {
        const droneId = hit.getId() as string | undefined;
        if (typeof droneId === 'string') {
          selectDrone(droneId);
        }
      } else {
        selectDrone(undefined);
      }
    });

    map.on('pointermove', (ev) => {
      const hit = map.hasFeatureAtPixel(ev.pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      map.dispose();
      mapInstanceRef.current = null;
      droneSourceRef.current = null;
    };
  }, [selectDrone]);

  useEffect(() => {
    const source = droneSourceRef.current;
    if (!source) return;

    const droneList = Array.from(drones.values());
    const toAdd: Feature<Point>[] = [];
    const existingIds = new Set(drones.keys());

    for (const drone of droneList) {
      let feature = source.getFeatureById(drone.droneId) as
        | Feature<Point>
        | undefined;
      if (!feature) {
        feature = new Feature<Point>();
        feature.setId(drone.droneId);
        toAdd.push(feature);
      }
      feature.setGeometry(new Point(fromLonLat([drone.lng, drone.lat])));
      feature.set('heading', drone.heading);
      feature.set('selected', drone.droneId === selectedDroneId);
    }

    if (toAdd.length > 0) {
      source.addFeatures(toAdd);
    }

    const toRemove = source
      .getFeatures()
      .filter(
        (f) => !existingIds.has((f.getId() as string) ?? ''),
      ) as Feature<Point>[];
    if (toRemove.length > 0) {
      source.removeFeatures(toRemove);
    }
  }, [drones, selectedDroneId]);

  // Fly to selected drone when selection changes (same as FlightpathFlyToSelected)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedDrone) return;
    const view = map.getView();
    if (view.getAnimating()) return;
    view.animate({
      center: fromLonLat([selectedDrone.lng, selectedDrone.lat]),
      zoom: 14,
      duration: 1500,
    });
    // Only run when selection changes, not on every position update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDroneId]);

  return (
    <div
      className={cn('relative w-full h-full min-h-0', className)}
      ref={mapContainerRef}
    />
  );
}
