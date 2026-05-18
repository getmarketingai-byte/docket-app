type Props = {
  taxClaimable?: boolean | null;
  confidence?: string | null;
  size?: 'sm' | 'md';
};

export function ClaimabilityDot({ taxClaimable, confidence, size = 'sm' }: Props) {
  const conf = confidence ? parseFloat(confidence) : null;
  const dim = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5';

  if (taxClaimable == null && conf == null) {
    return <span className={`inline-block rounded-full bg-gray-300 ${dim}`} title="Not assessed" />;
  }

  const score = conf ?? (taxClaimable ? 0.9 : 0.1);

  if (score > 0.8) {
    return <span className={`inline-block rounded-full bg-green-500 ${dim}`} title={`Likely claimable (${Math.round(score * 100)}%)`} />;
  }
  if (score >= 0.4) {
    return <span className={`inline-block rounded-full bg-yellow-400 ${dim}`} title={`Possibly claimable (${Math.round(score * 100)}%)`} />;
  }
  return <span className={`inline-block rounded-full bg-red-400 ${dim}`} title={`Unlikely claimable (${Math.round(score * 100)}%)`} />;
}

export function ClaimabilityBadge({ taxClaimable, confidence }: Props) {
  const conf = confidence ? parseFloat(confidence) : null;

  if (taxClaimable == null && conf == null) {
    return <span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-gray-300 inline-block" />Not assessed</span>;
  }

  const score = conf ?? (taxClaimable ? 0.9 : 0.1);

  if (score > 0.8) {
    return <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Likely claimable</span>;
  }
  if (score >= 0.4) {
    return <span className="inline-flex items-center gap-1.5 text-xs text-yellow-700 font-medium"><span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />Possibly claimable</span>;
  }
  return <span className="inline-flex items-center gap-1.5 text-xs text-red-700 font-medium"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Unlikely claimable</span>;
}
