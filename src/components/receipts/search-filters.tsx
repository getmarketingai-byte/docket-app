'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FilterValues = {
  q: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  claimable: string;
  hasGst: string;
  sortBy: string;
};

type Props = {
  categories: string[];
  defaultValues: FilterValues;
};

export function SearchFilters({ categories, defaultValues }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const applyFilters = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of data.entries()) {
      if (value && typeof value === 'string' && value.trim()) {
        params.set(key, value.trim());
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return (
    <form onSubmit={applyFilters} className="space-y-4">
      {/* Search query */}
      <div className="flex gap-2">
        <Input
          name="q"
          defaultValue={defaultValues.q}
          placeholder="Search merchants, notes, OCR text…"
          className="flex-1"
        />
        <Button type="submit">Search</Button>
        {(defaultValues.q || defaultValues.category || defaultValues.dateFrom || defaultValues.claimable) && (
          <Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button>
        )}
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select name="category" defaultValue={defaultValues.category}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input name="dateFrom" type="date" defaultValue={defaultValues.dateFrom} className="h-8 text-xs" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input name="dateTo" type="date" defaultValue={defaultValues.dateTo} className="h-8 text-xs" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Min $</Label>
          <Input name="minAmount" type="number" step="0.01" defaultValue={defaultValues.minAmount} className="h-8 text-xs" placeholder="0" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Max $</Label>
          <Input name="maxAmount" type="number" step="0.01" defaultValue={defaultValues.maxAmount} className="h-8 text-xs" placeholder="∞" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Claimable</Label>
          <Select name="claimable" defaultValue={defaultValues.claimable}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="true">Likely claimable</SelectItem>
              <SelectItem value="false">Not claimable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Has GST</Label>
          <input
            type="checkbox"
            name="hasGst"
            value="true"
            defaultChecked={defaultValues.hasGst === 'true'}
            className="h-3.5 w-3.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Sort by</Label>
          <Select name="sortBy" defaultValue={defaultValues.sortBy}>
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </form>
  );
}
