'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createVehicle } from '@/lib/actions/vehicles';

export function VehicleAddForm() {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    await createVehicle(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" /> Add vehicle</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add vehicle</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Vehicle name *</Label>
            <Input id="name" name="name" placeholder='e.g. "Work Ute"' required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="make">Make</Label>
              <Input id="make" name="make" placeholder="Toyota" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" placeholder="HiLux" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" type="number" placeholder="2022" min="1900" max="2099" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rego">Rego</Label>
              <Input id="rego" name="rego" placeholder="ABC123" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fuelType">Fuel type</Label>
              <Select name="fuelType" defaultValue="petrol">
                <SelectTrigger id="fuelType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessUsePercent">Business use %</Label>
              <Input id="businessUsePercent" name="businessUsePercent" type="number" min="0" max="100" defaultValue="0" />
            </div>
          </div>
          <Button type="submit" className="w-full">Add vehicle</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
