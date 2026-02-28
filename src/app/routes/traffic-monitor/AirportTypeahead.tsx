import { useCallback, useMemo, useState } from 'react';

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../../components/ui/combobox';
import {
  airports as unsortedAirports,
  airportById,
} from '../../../gen/airports';
import { cn } from '../../../utils/cn';

import type { Airport } from '../../../gen/airports';

const airports = [...unsortedAirports].sort((a, b) => a.id.localeCompare(b.id));

function getFilteredAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return airports.slice(0, 20);
  }
  const byId = airports.filter((a) => a.id.toLowerCase().startsWith(q));
  const idSet = new Set(byId.map((a) => a.id));
  const rest = airports.filter(
    (a) =>
      !idSet.has(a.id) &&
      (a.name.toLowerCase().includes(q) ||
        a.municipality.toLowerCase().includes(q)),
  );
  return [...byId, ...rest].slice(0, 20);
}

function airportToLabel(airport: Airport): string {
  return `${airport.id} - ${airport.name}`;
}

interface AirportTypeaheadProps {
  className?: string;
  selectedAirportId?: string;
  onAirportChange: (airportId: string | undefined) => void;
}

/**
 * Airport search typeahead. Matches IATA code, name, and city.
 * Selecting an airport stores its id; clear button resets selection.
 */
function AirportTypeahead({
  className,
  selectedAirportId,
  onAirportChange,
}: AirportTypeaheadProps) {
  const selectedAirport = selectedAirportId
    ? airportById.get(selectedAirportId)
    : undefined;

  const [typingValue, setTypingValue] = useState('');

  const inputValue = selectedAirport
    ? airportToLabel(selectedAirport)
    : typingValue;

  const handleInputValueChange = useCallback(
    (newValue: string) => {
      setTypingValue(newValue);
      if (selectedAirport && newValue !== airportToLabel(selectedAirport)) {
        onAirportChange(undefined);
      }
    },
    [selectedAirport, onAirportChange, setTypingValue],
  );

  const handleValueChange = useCallback(
    (value: Airport | null) => {
      onAirportChange(value?.id);
      setTypingValue('');
    },
    [onAirportChange, setTypingValue],
  );

  const filteredItems = useMemo(
    () => getFilteredAirports(inputValue),
    [inputValue],
  );

  return (
    <div className={cn('w-full', className)}>
      <Combobox<Airport>
        items={airports}
        value={selectedAirport ?? null}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        isItemEqualToValue={(a, b) => a.id === b.id}
        itemToStringLabel={airportToLabel}
        filteredItems={filteredItems}
        limit={20}
      >
        <ComboboxInput
          placeholder="Search by IATA, name, or city..."
          showClear={!!selectedAirportId}
          className="w-full"
        />
        <ComboboxContent className="w-(--anchor-width)">
          <ComboboxList>
            <ComboboxCollection>
              {(airport: Airport) => (
                <ComboboxItem
                  value={airport}
                  className="flex-col items-start gap-0.5"
                >
                  <span className="font-medium">{airport.id}</span>
                  <span
                    className="text-muted-foreground min-w-0 w-full truncate text-xs"
                    title={`${airport.name}, ${airport.municipality}`}
                  >
                    {airport.name}, {airport.municipality}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxCollection>
            <ComboboxEmpty>No airports found</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export { AirportTypeahead };
