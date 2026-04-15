'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerDocuments } from '@/hooks/queries/use-customers';
import type { CustomerDocumentDto, DocumentType, DocumentSide } from '@rentapp/shared';

const TYPE_LABELS: Record<DocumentType, string> = {
  ID_CARD: 'Dowod osobisty',
  DRIVER_LICENSE: 'Prawo jazdy',
};

const SIDE_LABELS: Record<DocumentSide, string> = {
  front: 'Przod',
  back: 'Tyl',
};

interface Props {
  customerId: string;
}

export function DocumentsSection({ customerId }: Props) {
  const { data: documents, isLoading } = useCustomerDocuments(customerId);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Dokumenty</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="w-[160px] h-[100px] rounded-lg" />
              <Skeleton className="w-[160px] h-[100px] rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="w-[160px] h-[100px] rounded-lg" />
              <Skeleton className="w-[160px] h-[100px] rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Dokumenty</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Brak zeskanowanych dokumentow
          </p>
        </CardContent>
      </Card>
    );
  }

  const idCard = documents.find((d) => d.type === 'ID_CARD');
  const driverLicense = documents.find((d) => d.type === 'DRIVER_LICENSE');

  function renderDocumentColumn(doc: CustomerDocumentDto | undefined, type: DocumentType) {
    const typeLabel = TYPE_LABELS[type];

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{typeLabel}</h3>
        {(['front', 'back'] as const).map((side) => {
          const photo = doc?.photos.find((p) => p.side === side);
          const sideLabel = SIDE_LABELS[side];

          return (
            <div key={side} className="space-y-1">
              <p className="text-sm text-muted-foreground">{sideLabel}</p>
              {photo ? (
                <img
                  src={photo.thumbnailUrl ?? photo.url}
                  alt="Zdjecie dokumentu klienta"
                  className="w-[160px] h-auto rounded-lg border border-warm-stone cursor-pointer hover:ring-2 ring-forest-green"
                  onClick={() =>
                    setSelectedImage({
                      url: photo.url,
                      title: `${typeLabel} -- ${sideLabel}`,
                    })
                  }
                />
              ) : (
                <div className="w-[160px] h-[100px] rounded-lg border border-dashed border-muted-foreground/40 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Brak</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Dokumenty</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {renderDocumentColumn(idCard, 'ID_CARD')}
            {renderDocumentColumn(driverLicense, 'DRIVER_LICENSE')}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
          </DialogHeader>
          <img
            src={selectedImage?.url}
            alt="Zdjecie dokumentu klienta"
            className="w-full h-auto rounded-md"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
