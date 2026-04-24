'use client';

import { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCustomerDocuments,
  useCustomerFiles,
  useUploadDriverGovReport,
} from '@/hooks/queries/use-customers';
import type {
  CustomerDocumentDto,
  DocumentType,
  DocumentSide,
  CustomerFileDto,
} from '@rentapp/shared';

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
  const { data: files, isLoading: filesLoading } = useCustomerFiles(customerId);
  const uploadDriverGovReport = useUploadDriverGovReport(customerId);
  const [selectedReport, setSelectedReport] = useState<File | null>(null);
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

  const customerDocuments = documents ?? [];
  const idCard = customerDocuments.find((d) => d.type === 'ID_CARD');
  const driverLicense = customerDocuments.find((d) => d.type === 'DRIVER_LICENSE');
  const driverGovReports = (files ?? []).filter((file) => file.type === 'DRIVER_GOV_REPORT');

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

  function renderDriverGovReport(file: CustomerFileDto) {
    return (
      <a
        key={file.id}
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm hover:bg-muted/50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-forest-green" />
          <span className="truncate">{file.fileName}</span>
        </span>
        <span className="shrink-0 text-muted-foreground">
          {new Date(file.uploadedAt).toLocaleString('pl-PL')}
        </span>
      </a>
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

          <div className="mt-8 border-t pt-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Raport kierowca.gov.pl</h3>
                <p className="text-sm text-muted-foreground">
                  Bezpieczna wersja operacyjna: pracownik pobiera PDF z gov.pl i zapisuje go tutaj.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(event) => setSelectedReport(event.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                disabled={!selectedReport || uploadDriverGovReport.isPending}
                onClick={() => {
                  if (!selectedReport) return;
                  uploadDriverGovReport.mutate(selectedReport, {
                    onSuccess: () => setSelectedReport(null),
                  });
                }}
              >
                <Upload className="h-4 w-4" />
                {uploadDriverGovReport.isPending ? 'Zapisywanie...' : 'Zapisz PDF'}
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {filesLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : driverGovReports.length > 0 ? (
                driverGovReports.map(renderDriverGovReport)
              ) : (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Brak zapisanego raportu kierowca.gov.pl.
                </p>
              )}
            </div>
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
