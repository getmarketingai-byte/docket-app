'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type FeedbackRow = {
  id: string;
  userId: string;
  type: string;
  description: string;
  screenshotUrl: string | null;
  pageUrl: string | null;
  browserInfo: string | null;
  status: string;
  ceoNotes: string | null;
  priority: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const STATUS_TABS = ['all', 'new', 'reviewing', 'approved', 'rejected', 'implemented'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  reviewing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  implemented: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const TYPE_EMOJI: Record<string, string> = { bug: '🐛', feature: '✨', suggestion: '💡' };

export function AdminFeedbackTable({
  feedback,
  currentStatus,
}: {
  feedback: FeedbackRow[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function patch(id: string, updates: Record<string, string | null>) {
    setSaving(id);
    await fetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setSaving(null);
    router.refresh();
  }

  async function saveNotes(id: string) {
    await patch(id, { ceoNotes: notes[id] ?? null });
  }

  return (
    <div>
      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <a
            key={s}
            href={`/admin/feedback${s === 'all' ? '' : `?status=${s}`}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition capitalize ${
              currentStatus === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      {feedback.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No feedback found.
        </div>
      ) : (
        <div className="space-y-2">
          {feedback.map((row) => (
            <div key={row.id} className="rounded-lg border bg-card overflow-hidden">
              {/* Summary row */}
              <button
                className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/40 transition"
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
              >
                <span className="text-lg mt-0.5">{TYPE_EMOJI[row.type] ?? '📝'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] ?? ''}`}
                    >
                      {row.status}
                    </span>
                    {row.priority && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {row.priority}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(row.createdAt).toLocaleDateString('en-AU')}
                    </span>
                  </div>
                  <p className="text-sm truncate">{row.description}</p>
                  {row.pageUrl && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{row.pageUrl}</p>
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === row.id && (
                <div className="border-t p-4 space-y-4 bg-muted/20">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Full description</p>
                    <p className="text-sm whitespace-pre-wrap">{row.description}</p>
                  </div>

                  {row.screenshotUrl && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Screenshot</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.screenshotUrl}
                        alt="Feedback screenshot"
                        className="max-h-64 rounded border object-contain"
                      />
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <Textarea
                      value={notes[row.id] ?? row.ceoNotes ?? ''}
                      onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                      placeholder="Add notes…"
                      rows={3}
                      className="resize-none"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => saveNotes(row.id)}
                      disabled={saving === row.id}
                    >
                      Save notes
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patch(row.id, { status: 'reviewing' })}
                        disabled={saving === row.id || row.status === 'reviewing'}
                      >
                        Mark reviewing
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => patch(row.id, { status: 'approved' })}
                        disabled={saving === row.id || row.status === 'approved'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => patch(row.id, { status: 'rejected' })}
                        disabled={saving === row.id || row.status === 'rejected'}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => patch(row.id, { status: 'implemented' })}
                        disabled={saving === row.id || row.status === 'implemented'}
                      >
                        Mark implemented
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
