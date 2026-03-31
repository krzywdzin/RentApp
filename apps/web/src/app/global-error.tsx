'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md">
          <h1 className="text-2xl font-display font-semibold text-charcoal">Cos poszlo nie tak</h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Sprobuj ponownie
            </button>
            <a href="/" className="text-sm text-muted-foreground hover:underline">
              Wroc do strony glownej
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
