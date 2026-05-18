import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { processReceipt } from '@/lib/inngest/functions/process-receipt';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processReceipt],
});
