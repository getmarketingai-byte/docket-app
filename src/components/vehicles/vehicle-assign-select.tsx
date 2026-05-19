'use client';
import { useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignReceiptToVehicle } from '@/lib/actions/vehicles';

type Vehicle = { id: string; name: string };

type Props = {
  receiptId: string;
  vehicleId?: string | null;
  vehicles: Vehicle[];
};

export function VehicleAssignSelect({ receiptId, vehicleId, vehicles }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    startTransition(async () => {
      await assignReceiptToVehicle(receiptId, value === 'none' ? null : value);
    });
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Assign to vehicle</label>
      <Select defaultValue={vehicleId ?? 'none'} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger>
          <SelectValue placeholder="No vehicle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No vehicle</SelectItem>
          {vehicles.map((v) => (
            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
