import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { processReceipt } from '@/lib/inngest/functions/process-receipt';
import { sendFeedbackEmail } from '@/lib/inngest/functions/send-feedback-email';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processReceipt, sendFeedbackEmail],
});
