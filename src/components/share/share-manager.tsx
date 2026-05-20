'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Trash2, Plus, Check, Link as LinkIcon } from 'lucide-react';

type ShareToken = {
  id: string;
  token: string;
  label: string;
  dateFrom: string | null;
  dateTo: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type Props = { initialShares: ShareToken[]; baseUrl: string };

export function ShareManager({ initialShares, baseUrl }: Props) {
  const [shares, setShares] = useState(initialShares);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('Accountant access');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('90');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shareUrl = (token: string) => `${baseUrl}/shared/${token}`;

  const createShare = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label || 'Accountant access',
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        }),
      });
      const data = await res.json() as { share: ShareToken };
      setShares([data.share, ...shares]);
      setCreating(false);
      setLabel('Accountant access');
      setDateFrom('');
      setDateTo('');
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (token: string) => {
    if (!confirm('Revoke this link? Anyone with it will lose access immediately.')) return;
    await fetch(`/api/shares/${token}`, { method: 'DELETE' });
    setShares(shares.map(s => s.token === token ? { ...s, revokedAt: new Date().toISOString() } : s));
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(shareUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const activeShares = shares.filter(s => !s.revokedAt);
  const revokedShares = shares.filter(s => s.revokedAt);

  return (
    <div className="space-y-6">
      {/* Create form */}
      {creating ? (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">New share link</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. FY2025 for accountant"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFrom">From date (optional)</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateTo">To date (optional)</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expires">Expires in (days, blank = never)</Label>
              <Input
                id="expires"
                type="number"
                min="1"
                value={expiresInDays}
                onChange={e => setExpiresInDays(e.target.value)}
                placeholder="90"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={createShare} disabled={loading} size="sm">
              {loading ? 'Creating…' : 'Create link'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setCreating(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New share link
        </Button>
      )}

      {/* Active links */}
      {activeShares.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Active links</h2>
          {activeShares.map(share => (
            <div key={share.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <LinkIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm truncate">{share.label}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyLink(share.token)}
                    title="Copy link"
                  >
                    {copiedToken === share.token ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => revokeShare(share.token)}
                    title="Revoke link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {shareUrl(share.token)}
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {share.dateFrom && <span>From: {new Date(share.dateFrom).toLocaleDateString('en-AU')}</span>}
                {share.dateTo && <span>To: {new Date(share.dateTo).toLocaleDateString('en-AU')}</span>}
                {!share.dateFrom && !share.dateTo && <span>All receipts</span>}
                {share.expiresAt && (
                  <span>
                    Expires: {new Date(share.expiresAt).toLocaleDateString('en-AU')}
                  </span>
                )}
                {!share.expiresAt && <span>No expiry</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeShares.length === 0 && !creating && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No active share links. Create one to give your accountant read-only access.
        </div>
      )}

      {/* Revoked links */}
      {revokedShares.length > 0 && (
        <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
            {revokedShares.length} revoked link{revokedShares.length !== 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-2 opacity-50">
            {revokedShares.map(share => (
              <div key={share.id} className="rounded-lg border p-3">
                <p className="font-medium text-xs line-through">{share.label}</p>
                <p className="text-xs text-muted-foreground">
                  Revoked {new Date(share.revokedAt!).toLocaleDateString('en-AU')}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="text-xs text-muted-foreground">
        Share links give read-only access to your receipts. No login required for the recipient.
        Revoke any link instantly to remove access.
      </p>
    </div>
  );
}
