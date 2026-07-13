import z from 'zod';

export const PreviewMessageSchema = z.object({
  type: z.string(),
  url: z.string(),
  timestamp: z.number(),
});

// Explicit type instead of z.infer: tsup emits z.z.core.$strip (Zod v4 internal)
// into the .d.ts which makes z.infer resolve to `any` in consumers.
export interface PreviewMessage {
  type: string;
  url: string;
  timestamp: number;
}

export type PreviewBridgeListener = (data: PreviewMessage) => void;
