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
          <div className="space-y-1">
            <p className="font-mono text-sm font-medium text-muted-foreground">
              Error 404
            </p>
            <CardTitle className="text-2xl">Page not found</CardTitle>
            <CardDescription className="text-base">
              The page you're looking for doesn't exist or has been moved. Go
              back home to continue.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="default"
            size="lg"
            nativeButton={false}
            render={<Link to="/">Return to Home</Link>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
