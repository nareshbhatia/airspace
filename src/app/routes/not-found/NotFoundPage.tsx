import { MapPinOff } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4 pb-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
            <MapPinOff className="size-7 text-muted-foreground" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="font-mono text-sm font-medium text-muted-foreground">
              NAV: WAYPOINT_NOT_FOUND
            </p>
            <CardTitle className="text-2xl">404 — Off course</CardTitle>
            <CardDescription className="text-base">
              No flight plan for this heading. The waypoint you’re looking for
              isn’t in the system. Return to base and pick a known route.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="default"
            size="lg"
            nativeButton={false}
            render={<Link to="/">Return to base</Link>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
