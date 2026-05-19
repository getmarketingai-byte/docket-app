import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Car } from 'lucide-react';
import { getCurrentUserProfileId, getVehiclesForUser } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleAddForm } from '@/components/vehicles/vehicle-add-form';

export default async function VehiclesPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const userVehicles = await getVehiclesForUser(profileId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Track fuel, costs, and mileage per vehicle</p>
        </div>
        <VehicleAddForm />
      </div>

      {userVehicles.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <Car className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">No vehicles yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add a vehicle to track fuel costs and mileage</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userVehicles.map((v) => (
            <Link key={v.id} href={`/dashboard/vehicles/${v.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Car className="h-4 w-4 text-primary" />
                    {v.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {(v.make || v.model) && (
                    <p>{[v.year, v.make, v.model].filter(Boolean).join(' ')}</p>
                  )}
                  {v.rego && <p>Rego: {v.rego}</p>}
                  <p className="capitalize">{v.fuelType ?? 'petrol'} &bull; {v.businessUsePercent ?? 0}% business use</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
