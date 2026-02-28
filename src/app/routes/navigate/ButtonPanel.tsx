import { Button } from '../../../components/ui/button';

const AIRPORTS = [
  'BAH',
  'BOS',
  'DXB',
  'HND',
  'JFK',
  'LAX',
  'LHR',
  'ORD',
  'SFO',
];

interface ButtonPanelProps {
  onAirportSelect: (airportId: string) => void;
}

export function ButtonPanel({ onAirportSelect }: ButtonPanelProps) {
  return (
    <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2">
      {AIRPORTS.map((airportId) => (
        <Button key={airportId} onClick={() => onAirportSelect(airportId)}>
          {airportId}
        </Button>
      ))}
    </div>
  );
}
