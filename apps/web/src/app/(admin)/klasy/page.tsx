'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useVehicleClasses,
  useCreateVehicleClass,
  useUpdateVehicleClass,
  useDeleteVehicleClass,
} from '@/hooks/queries/use-vehicle-classes';
import type { VehicleClassDto } from '@rentapp/shared';

export default function VehicleClassesPage() {
  const { data: classes, isLoading } = useVehicleClasses();
  const createClass = useCreateVehicleClass();
  const deleteClass = useDeleteVehicleClass();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VehicleClassDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleClassDto | null>(null);
  const [name, setName] = useState('');

  function openCreate() {
    setName('');
    setCreateOpen(true);
  }

  function openEdit(vc: VehicleClassDto) {
    setName(vc.name);
    setEditTarget(vc);
  }

  function handleCreate() {
    if (!name.trim()) return;
    createClass.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setName('');
        },
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteClass.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  const isEmpty = !isLoading && (!classes || classes.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-xl text-charcoal">Klasy pojazdow</h1>
        <Button onClick={openCreate}>Dodaj klase</Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Brak klas pojazdow</p>
          <p className="text-sm text-muted-foreground">
            Dodaj pierwsza klase, aby organizowac flote.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {/* Table */}
      {!isEmpty && !isLoading && classes && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead className="w-[120px] text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((vc) => (
                <TableRow key={vc.id}>
                  <TableCell className="font-body text-sm">{vc.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(vc)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edytuj</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(vc)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Usun</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <CreateEditDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nowa klasa pojazdu"
        confirmLabel="Dodaj klase"
        name={name}
        onNameChange={setName}
        onConfirm={handleCreate}
        isPending={createClass.isPending}
      />

      {/* Edit dialog */}
      {editTarget && (
        <EditDialogWrapper
          vehicleClass={editTarget}
          initialName={name}
          onClose={() => {
            setEditTarget(null);
            setName('');
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usun klase &quot;{deleteTarget?.name}&quot;?</DialogTitle>
            <DialogDescription>Tej operacji nie mozna cofnac.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Nie, wroc
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteClass.isPending}>
              {deleteClass.isPending ? 'Usuwanie...' : 'Usun klase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateEditDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  name,
  onNameChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  name: string;
  onNameChange: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nazwa klasy</label>
            <Input
              ref={inputRef}
              placeholder="np. Ekonomiczna"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  e.preventDefault();
                  onConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Nie, wroc
          </Button>
          <Button onClick={onConfirm} disabled={isPending || !name.trim()}>
            {isPending ? 'Zapisywanie...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialogWrapper({
  vehicleClass,
  initialName,
  onClose,
}: {
  vehicleClass: VehicleClassDto;
  initialName: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const updateClass = useUpdateVehicleClass(vehicleClass.id);

  function handleUpdate() {
    if (!name.trim()) return;
    updateClass.mutate({ name: name.trim() }, { onSuccess: () => onClose() });
  }

  return (
    <CreateEditDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Edytuj klase"
      confirmLabel="Zapisz nazwe"
      name={name}
      onNameChange={setName}
      onConfirm={handleUpdate}
      isPending={updateClass.isPending}
    />
  );
}
