'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ShareLink = {
  id: string;
  token: string;
  label: string | null;
  isActive: boolean;
  expiresAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
};

type Props = {
  initialLinks: ShareLink[];
};

export function ShareLinksSection({ initialLinks }: Props) {
  const [links, setLinks] = useState<ShareLink[]>(initialLinks);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function shareUrl(token: string) {
    return `${window.location.origin}/share/${token}`;
  }

  async function createLink() {
    setCreating(true);
    try {
      const res = await fetch('/api/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create link');
      const link = await res.json();
      setLinks((prev) => [link, ...prev]);
      setLabel('');
    } catch {
      alert('Failed to create share link. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteLink(id: string) {
    if (!confirm('Delete this share link? The accountant will lose access immediately.')) return;
    await fetch(`/api/share-links/${id}`, { method: 'DELETE' });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function copyLink(link: ShareLink) {
    await navigator.clipboard.writeText(shareUrl(link.token));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accountant Share Links</CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate a read-only link you can share with your accountant. They can view all your receipts and tax data without needing to log in.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new link */}
        <div className="flex gap-2">
          <Input
            placeholder="Label (e.g. For Jane Smith – Accountant)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createLink()}
            className="flex-1"
          />
          <Button onClick={createLink} disabled={creating} size="sm">
            {creating ? 'Creating…' : 'Create Link'}
          </Button>
        </div>

        {/* Existing links */}
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No share links yet. Create one above to share access with your accountant.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-start gap-3 rounded-lg border p-3 bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {link.label ?? 'Untitled link'}
                    </span>
                    {!link.isActive && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200">Revoked</Badge>
                    )}
                    {link.expiresAt && new Date(link.expiresAt) < new Date() && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">Expired</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {new Date(link.createdAt).toLocaleDateString('en-AU')}
                    {link.viewCount > 0 && (
                      <> · Viewed {link.viewCount} time{link.viewCount !== 1 ? 's' : ''}</>
                    )}
                    {link.lastViewedAt && (
                      <> · Last viewed {new Date(link.lastViewedAt).toLocaleDateString('en-AU')}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                    /share/{link.token}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => copyLink(link)}
                    disabled={!link.isActive}
                  >
                    {copiedId === link.id ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => deleteLink(link.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Share links give read-only access to your complete receipt history. Anyone with the link can view your data — keep it private.
        </p>
      </CardContent>
    </Card>
  );
}
