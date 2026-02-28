/**
 * Fetches OurAirports airports.csv, filters to rows with IATA codes, and
 * writes src/gen/airports.ts with typed Airport[] and airportById Map.
 *
 * Run: pnpm gen:airports
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const AIRPORTS_CSV_URL =
  'https://davidmegginson.github.io/ourairports-data/airports.csv';
const OUTPUT_PATH = new URL('../src/gen/airports.ts', import.meta.url);

async function fetchCsv() {
  const res = await fetch(AIRPORTS_CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch airports.csv: ${res.status}`);
  }
  return res.text();
}

function parseAirports(csvText) {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const airports = [];
  for (const row of records) {
    const iata = (row.iata_code ?? '').trim();
    if (!iata) continue;

    const lat = Number(row.latitude_deg);
    const lng = Number(row.longitude_deg);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    airports.push({
      id: iata,
      name: (row.name ?? '').trim() || '',
      municipality: (row.municipality ?? '').trim() || '',
      iso_country: (row.iso_country ?? '').trim() || '',
      coordinates: { lng, lat },
    });
  }
  return airports;
}

function formatAirport(a) {
  const id = JSON.stringify(a.id);
  const name = JSON.stringify(a.name);
  const municipality = JSON.stringify(a.municipality);
  const iso_country = JSON.stringify(a.iso_country);
  const { lng, lat } = a.coordinates;
  return `  { id: ${id}, name: ${name}, municipality: ${municipality}, iso_country: ${iso_country}, coordinates: { lng: ${lng}, lat: ${lat} } }`;
}

function generateTs(airports) {
  const airportLines = airports.map((a) => formatAirport(a));
  return [
    "import type { LngLat } from '../lib/mapbox';",
    '',
    'export interface Airport {',
    '  id: string;',
    '  name: string;',
    '  municipality: string;',
    '  iso_country: string;',
    '  coordinates: LngLat;',
    '}',
    '',
    'export const airports: Airport[] = [',
    ...airportLines.map(
      (line, i) => line + (i < airportLines.length - 1 ? ',' : ''),
    ),
    '];',
    '',
    'export const airportById = new Map<string, Airport>(',
    '  airports.map((airport) => [airport.id, airport]),',
    ');',
    '',
  ].join('\n');
}

async function main() {
  console.log('Fetching airports.csv...');
  const csvText = await fetchCsv();
  const airports = parseAirports(csvText);
  console.log(`Filtered to ${airports.length} airports with IATA codes.`);

  const ts = generateTs(airports);
  const path = fileURLToPath(OUTPUT_PATH);
  writeFileSync(path, ts, 'utf8');
  console.log(`Wrote ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
