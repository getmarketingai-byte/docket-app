import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Receipt processing functions will be registered here in P1.2
  ],
});
