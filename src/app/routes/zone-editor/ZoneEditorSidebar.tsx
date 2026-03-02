import { Button } from '../../../components/ui/button';
import { cn } from '../../../utils/cn';

interface ZoneEditorSidebarProps {
  className?: string;
}

/**
 * Left sidebar for the Zone Editor: drawing mode toolbar and zone list.
 */
export function ZoneEditorSidebar({ className }: ZoneEditorSidebarProps) {
  return (
    <aside
      className={cn(
        'flex w-[300px] shrink-0 flex-col border-r border-border bg-background',
        className,
      )}
    >
      <div className="border-b border-border px-3 py-3">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            Mission Boundary
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            No-Fly Zone
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            Restricted Airspace
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="border-b border-border px-3 py-2 text-sm font-medium">
          Zones
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <p className="text-sm text-muted-foreground">
            Select a zone type above to start drawing.
          </p>
        </div>
      </div>
    </aside>
  );
}
