import { FlightpathOLMap } from './FlightpathOLMap';
import { DroneServiceProvider } from '../../../providers/DroneServiceProvider/DroneServiceProvider';
import { cn } from '../../../utils/cn';
import { FlightpathSidebar } from '../flightpath/FlightpathSidebar';

/**
 * Flightpath (OpenLayers) page. Same functionality as the Flightpath page:
 * DroneServiceProvider, sidebar with playback and drone list, and a map.
 * The map is implemented with OpenLayers and shows a single drone (selected
 * drone if set, otherwise the first drone in the store).
 */
export function FlightpathOLPage() {
  return (
    <DroneServiceProvider>
      <div className={cn('flex flex-1 min-h-0')}>
        <FlightpathSidebar className="w-[280px] shrink-0" />
        <FlightpathOLMap className="flex-1 min-w-0" />
      </div>
    </DroneServiceProvider>
  );
}
