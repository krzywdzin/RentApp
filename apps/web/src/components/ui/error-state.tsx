import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Wystapil blad podczas ladowania danych.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-t-2 border-t-destructive">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <h4 className="font-display font-medium text-lg text-destructive mb-2">Blad</h4>
        <p className="font-body text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Ponow probe
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
