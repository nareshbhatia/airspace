import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';

import type { Station } from './types/Station';

interface StationInfoCardProps {
  station: Station;
}

export function StationInfoCard({ station }: StationInfoCardProps) {
  return (
    <Card size="sm" className="min-w-48">
      <CardHeader>
        <CardTitle>{station.name}</CardTitle>
        <CardDescription>Line: {station.line}</CardDescription>
      </CardHeader>
    </Card>
  );
}
