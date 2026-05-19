'use client';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { deleteVehicle } from '@/lib/actions/vehicles';

export function VehicleDeleteButton({ vehicleId }: { vehicleId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Delete this vehicle? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteVehicle(vehicleId);
    });
  };

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Deleting\u2026' : 'Delete vehicle'}
    </Button>
  );
}
