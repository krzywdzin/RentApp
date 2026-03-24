'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { PhotoComparisonPair } from '@rentapp/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

const POSITION_LABELS: Record<string, string> = {
  front: 'Przod',
  rear: 'Tyl',
  left_side: 'Lewa strona',
  right_side: 'Prawa strona',
  interior_front: 'Wnetrze przod',
  interior_rear: 'Wnetrze tyl',
  dashboard: 'Deska/przebieg',
  trunk: 'Bagaznik',
};

interface PhotoComparisonProps {
  data: PhotoComparisonPair[];
}

export function PhotoComparison({ data }: PhotoComparisonProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-4">
        {/* Column headers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center text-sm font-medium text-muted-foreground">
            Stan przy wydaniu
          </div>
          <div className="text-center text-sm font-medium text-muted-foreground">
            Stan przy zwrocie
          </div>
        </div>

        {data.map((pair) => (
          <Card key={pair.position}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">
                <Badge variant="outline">
                  {POSITION_LABELS[pair.position] ?? pair.position}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {/* Handover photo */}
                <PhotoThumbnail
                  photo={pair.handover}
                  emptyLabel="Brak zdjecia wydania"
                  onClick={(url) => setLightboxUrl(url)}
                />

                {/* Return photo */}
                <PhotoThumbnail
                  photo={pair.return}
                  emptyLabel="Brak zdjecia zwrotu"
                  onClick={(url) => setLightboxUrl(url)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogTitle className="sr-only">Podglad zdjecia</DialogTitle>
          {lightboxUrl && (
            <div className="relative aspect-video w-full">
              <Image
                src={lightboxUrl}
                alt="Zdjecie pojazdu"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PhotoThumbnail({
  photo,
  emptyLabel,
  onClick,
}: {
  photo: { photoUrl: string; thumbnailUrl: string } | null;
  emptyLabel: string;
  onClick: (url: string) => void;
}) {
  if (!photo) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25">
        <span className="text-xs text-muted-foreground">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(photo.photoUrl)}
      className="group relative aspect-square overflow-hidden rounded-md border border-border"
    >
      <Image
        src={photo.thumbnailUrl}
        alt="Miniatura"
        fill
        className="object-cover transition-transform group-hover:scale-105"
        unoptimized
      />
    </button>
  );
}
