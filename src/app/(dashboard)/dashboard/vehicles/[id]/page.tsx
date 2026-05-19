import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Car, ArrowLeft, Fuel, TrendingUp, DollarSign } from 'lucide-react';
import { getCurrentUserProfileId, getVehicleWithStats } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VehicleEditForm } from '@/components/vehicles/vehicle-edit-form';
import { VehicleDeleteButton } from '@/components/vehicles/vehicle-delete-button';

type PageProps = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const data = await getVehicleWithStats(profileId, id);
  if (!data) notFound();

  const { vehicle, vehicleReceipts, fuelLogs, totalCost, costByCategory, fuelEconomy, costPerKm } = data;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/vehicles" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-1')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Vehicles
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            {vehicle.name}
          </h1>
          {(vehicle.make || vehicle.model) && (
            <p className="text-muted-foreground">{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}</p>
          )}
        </div>
        <VehicleDeleteButton vehicleId={vehicle.id} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> Total cost
            </div>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{vehicleReceipts.length} receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Fuel className="h-4 w-4" /> Fuel economy
            </div>
            <p className="text-2xl font-bold">
              {fuelEconomy != null ? `${fuelEconomy.toFixed(1)} L/100km` : '\u2014'}
            </p>
            <p className="text-xs text-muted-foreground">{fuelLogs.length} fuel fills logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" /> Cost per km
            </div>
            <p className="text-2xl font-bold">
              {costPerKm != null ? `$${costPerKm.toFixed(3)}` : '\u2014'}
            </p>
            <p className="text-xs text-muted-foreground">{vehicle.businessUsePercent ?? 0}% business use</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost breakdown */}
      {Object.keys(costByCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(costByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{cat.replace(/_/g, ' ')}</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ATO logbook summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">ATO logbook summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Business use</span>
            <span className="font-medium">{vehicle.businessUsePercent ?? 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total vehicle costs</span>
            <span className="font-medium">${totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Potentially deductible (AI estimate)</span>
            <span className="font-medium text-green-700">
              ${((totalCost * (vehicle.businessUsePercent ?? 0)) / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground italic mt-2">
            AI estimate &mdash; review with your accountant.
          </p>
        </CardContent>
      </Card>

      {/* Vehicle edit form */}
      <VehicleEditForm vehicle={vehicle} />

      {/* Fuel log */}
      {fuelLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fuel log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {fuelLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center py-1 border-b last:border-0">
                  <div>
                    <p className="font-medium">{log.litres ? `${parseFloat(log.litres).toFixed(2)}L` : '\u2014'}</p>
                    {log.odometerReading && (
                      <p className="text-xs text-muted-foreground">{log.odometerReading.toLocaleString()} km</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{log.totalCost ? `$${parseFloat(log.totalCost).toFixed(2)}` : '\u2014'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.loggedAt).toLocaleDateString('en-AU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipts */}
      {vehicleReceipts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Assigned receipts ({vehicleReceipts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vehicleReceipts.map((r) => (
                <Link key={r.id} href={`/dashboard/receipts/${r.id}`}
                  className="flex justify-between items-center text-sm py-1 border-b last:border-0 hover:text-primary transition-colors">
                  <div>
                    <p className="font-medium">{r.merchant ?? 'Unknown merchant'}</p>
                    {r.receiptDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.receiptDate).toLocaleDateString('en-AU')}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">{r.totalAmount ? `$${parseFloat(r.totalAmount).toFixed(2)}` : '\u2014'}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
