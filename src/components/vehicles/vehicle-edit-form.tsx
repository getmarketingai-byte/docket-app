'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateVehicle } from '@/lib/actions/vehicles';

type Vehicle = {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  rego?: string | null;
  fuelType?: string | null;
  businessUsePercent?: number | null;
};

export function VehicleEditForm({ vehicle }: { vehicle: Vehicle }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (formData: FormData) => {
    setSaving(true);
    setSaved(false);
    try {
      await updateVehicle(vehicle.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Vehicle details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Vehicle name</Label>
            <Input id="edit-name" name="name" defaultValue={vehicle.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-make">Make</Label>
              <Input id="edit-make" name="make" defaultValue={vehicle.make ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-model">Model</Label>
              <Input id="edit-model" name="model" defaultValue={vehicle.model ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-year">Year</Label>
              <Input id="edit-year" name="year" type="number" defaultValue={vehicle.year ?? ''} min="1900" max="2099" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-rego">Rego</Label>
              <Input id="edit-rego" name="rego" defaultValue={vehicle.rego ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fuelType">Fuel type</Label>
              <Select name="fuelType" defaultValue={vehicle.fuelType ?? 'petrol'}>
                <SelectTrigger id="edit-fuelType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-businessUsePercent">Business use %</Label>
              <Input id="edit-businessUsePercent" name="businessUsePercent" type="number" min="0" max="100" defaultValue={vehicle.businessUsePercent ?? 0} />
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving\u2026' : saved ? '\u2713 Saved' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
