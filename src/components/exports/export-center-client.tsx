'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  currentFy: string;
  fyOptions: string[];
};

export function ExportCenterClient({ currentFy, fyOptions }: Props) {
  const [csvDateFrom, setCsvDateFrom] = useState('');
  const [csvDateTo, setCsvDateTo] = useState('');
  const [csvCategory, setCsvCategory] = useState('');
  const [quarter, setQuarter] = useState('Q1');
  const [basFy, setBasFy] = useState(currentFy);
  const [reportFy, setReportFy] = useState(currentFy);

  const buildUrl = (base: string, params: Record<string, string>) => {
    const url = new URL(base, window.location.origin);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
    return url.toString();
  };

  const download = (url: string) => {
    window.location.href = url;
  };

  const openReport = (url: string) => {
    window.open(url, '_blank');
  };

  const CATEGORIES = [
    'meals', 'travel', 'accommodation', 'office_supplies', 'equipment',
    'software', 'utilities', 'professional_services', 'vehicle', 'other',
  ];

  return (
    <div className="space-y-6">
      {/* CSV Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download all your receipts as a spreadsheet. Opens in Excel, Google Sheets, or Numbers.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From date</Label>
              <Input type="date" value={csvDateFrom} onChange={(e) => setCsvDateFrom(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To date</Label>
              <Input type="date" value={csvDateTo} onChange={(e) => setCsvDateTo(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={csvCategory} onValueChange={(v) => setCsvCategory(v ?? '')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => download(buildUrl('/api/exports/csv', {
                dateFrom: csvDateFrom, dateTo: csvDateTo, category: csvCategory,
              }))}
            >
              Download CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => download(buildUrl('/api/exports/csv', {
                format: 'hnry', dateFrom: csvDateFrom, dateTo: csvDateTo,
              }))}
            >
              Download Hnry CSV
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Hnry CSV includes only claimable receipts in Hnry&apos;s import format.
          </p>
        </CardContent>
      </Card>

      {/* GST/BAS Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">GST / BAS Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a quarterly GST summary in BAS-ready format. Australian financial year (Jul–Jun).
          </p>
          <div className="flex gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Financial year</Label>
              <Select value={basFy} onValueChange={(v) => setBasFy(v ?? currentFy)}>
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fyOptions.map((y) => (
                    <SelectItem key={y} value={y}>FY{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quarter</Label>
              <Select value={quarter} onValueChange={(v) => setQuarter(v ?? 'Q1')}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1 — Jul–Sep</SelectItem>
                  <SelectItem value="Q2">Q2 — Oct–Dec</SelectItem>
                  <SelectItem value="Q3">Q3 — Jan–Mar</SelectItem>
                  <SelectItem value="Q4">Q4 — Apr–Jun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => download(buildUrl('/api/exports/bas', { quarter, fy: basFy }))}
          >
            Download BAS CSV
          </Button>
          <p className="text-xs text-muted-foreground italic">
            AI estimate — review with your accountant before lodging with the ATO.
          </p>
        </CardContent>
      </Card>

      {/* PDF Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PDF Summary Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Professional summary report grouped by category with totals and ATO breakdown. Opens in browser — use Print → Save as PDF.
          </p>
          <div className="flex gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Financial year</Label>
              <Select value={reportFy} onValueChange={(v) => setReportFy(v ?? currentFy)}>
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fyOptions.map((y) => (
                    <SelectItem key={y} value={y}>FY{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openReport(buildUrl('/api/exports/report', { fy: reportFy }))}
          >
            Open Report
          </Button>
          <p className="text-xs text-muted-foreground">
            In the report, click &ldquo;Print / Save PDF&rdquo; to save as PDF.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
