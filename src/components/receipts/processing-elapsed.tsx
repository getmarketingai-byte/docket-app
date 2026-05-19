'use client';

import { useState, useEffect } from 'react';

type Props = {
  createdAt: string | Date;
  onRetry?: () => void;
};

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function ProcessingElapsed({ createdAt, onRetry }: Props) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const isLong = elapsed >= 120;

  return (
    <span className={`text-xs ${isLong ? 'text-amber-600' : 'text-muted-foreground'}`}>
      {isLong ? `Taking longer than expected... ${formatElapsed(elapsed)}` : `Processing... ${formatElapsed(elapsed)}`}
      {isLong && onRetry && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRetry(); }}
          className="ml-2 underline text-amber-600 hover:text-amber-700"
        >
          Retry
        </button>
      )}
    </span>
  );
}
