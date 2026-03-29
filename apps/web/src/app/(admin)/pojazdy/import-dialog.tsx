'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useImportVehicles, type ImportResult } from '@/hooks/queries/use-vehicles';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importVehicles = useImportVehicles();

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    importVehicles.reset();
  }, [importVehicles]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleReset();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, handleReset],
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleImport = useCallback(() => {
    if (!selectedFile) return;
    importVehicles.mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data);
      },
    });
  }, [selectedFile, importVehicles]);

  const hasErrors = result && result.errors.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importuj pojazdy</DialogTitle>
          <DialogDescription>
            Wczytaj pojazdy z pliku CSV lub Excel. Pobierz szablon, aby poznac wymagany format.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <a
                  href="/api/vehicles/import/template"
                  download
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Pobierz szablon
                </a>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Zmien plik
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Kliknij, aby wybrac plik</p>
                      <p className="text-xs text-muted-foreground">CSV, XLS lub XLSX</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Anuluj
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importVehicles.isPending}
              >
                {importVehicles.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importowanie...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importuj
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-md border p-3">
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                  <p className="text-xs text-muted-foreground">Dodanych</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground">Pominietych</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-xs text-muted-foreground">Bledow</p>
                </div>
              </div>

              {hasErrors && (
                <div className="max-h-48 overflow-y-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Wiersz</th>
                        <th className="px-3 py-2 text-left font-medium">Pole</th>
                        <th className="px-3 py-2 text-left font-medium">Powod</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{err.row}</td>
                          <td className="px-3 py-2">{err.field}</td>
                          <td className="px-3 py-2">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Zamknij</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
