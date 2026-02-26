import { airports } from './airports';
import { Button } from '../../../components/ui/button';

interface ButtonPanelProps {
  onAirportSelect: (airportId: string) => void;
}

export function ButtonPanel({ onAirportSelect }: ButtonPanelProps) {
  return (
    <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2">
      {airports.map((airport) => (
        <Button key={airport.id} onClick={() => onAirportSelect(airport.id)}>
          {airport.id}
        </Button>
      ))}
    </div>
  );
}
