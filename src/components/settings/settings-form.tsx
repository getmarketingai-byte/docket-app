'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { saveSettings } from '@/lib/actions/settings';

type TaxProfile = {
  abn?: string | null;
  entityType?: string | null;
  industry?: string | null;
  fyPreference?: string | null;
};

type SettingsData = {
  defaultBusinessPercentage?: number;
};

type Props = {
  displayName?: string | null;
  taxProfile?: TaxProfile | null;
  settings?: SettingsData | null;
};

const INDUSTRIES = [
  'IT / Software', 'Trades / Construction', 'Health / Medical', 'Finance / Accounting',
  'Legal', 'Creative / Media', 'Education', 'Transport / Delivery', 'Retail',
  'Food & Hospitality', 'Real Estate', 'Consulting', 'Other',
];

export function SettingsForm({ displayName, taxProfile, settings }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entityType, setEntityType] = useState(taxProfile?.entityType ?? '');
  const [industry, setIndustry] = useState(taxProfile?.industry ?? '');
  const [fyPref, setFyPref] = useState(taxProfile?.fyPreference ?? 'current');

  const handleSubmit = async (formData: FormData) => {
    // Inject select values (not submitted automatically in some browsers)
    formData.set('entityType', entityType);
    formData.set('industry', industry);
    formData.set('fyPreference', fyPref);

    setSaving(true);
    setSaved(false);
    try {
      await saveSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Profile */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Profile</h2>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={displayName ?? ''}
            placeholder="Your name"
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Tax profile */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Tax Profile</h2>
        <p className="text-sm text-muted-foreground">
          Help Docket give you better AI categorisation. This information stays on your account only.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="abn">ABN (optional)</Label>
            <Input
              id="abn"
              name="abn"
              defaultValue={taxProfile?.abn ?? ''}
              placeholder="XX XXX XXX XXX"
              className="max-w-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Entity type</Label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v ?? '')}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sole_trader">Sole trader</SelectItem>
                <SelectItem value="contractor">Contractor / Freelancer</SelectItem>
                <SelectItem value="employee">PAYG Employee</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Primary industry</Label>
            <Select value={industry} onValueChange={(v) => setIndustry(v ?? '')}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Financial year preference</Label>
            <Select value={fyPref} onValueChange={(v) => setFyPref(v ?? 'current')}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current FY (auto)</SelectItem>
                <SelectItem value="2026">FY2026 (Jul 25 – Jun 26)</SelectItem>
                <SelectItem value="2025">FY2025 (Jul 24 – Jun 25)</SelectItem>
                <SelectItem value="2024">FY2024 (Jul 23 – Jun 24)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Defaults</h2>
        <div className="space-y-1.5">
          <Label htmlFor="defaultBusinessPct">
            Default business use % for new receipts
          </Label>
          <Input
            id="defaultBusinessPct"
            name="defaultBusinessPct"
            type="number"
            min="0"
            max="100"
            defaultValue={(settings as Record<string, unknown>)?.defaultBusinessPercentage as number ?? 0}
            className="w-24"
          />
          <p className="text-xs text-muted-foreground">
            Applied automatically to newly uploaded receipts. You can override per-receipt.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save settings'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Tax profile is used to improve AI categorisation — it is not shared with the ATO or any third party.
      </p>
    </form>
  );
}
