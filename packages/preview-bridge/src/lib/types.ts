import z from 'zod';

const ReportEvent = {
  UrlChange: 'url_change',
  Ready: 'ready',
} as const;
type ReportEvent = (typeof ReportEvent)[keyof typeof ReportEvent];

const ActionEvent = {
  GoBack: 'url_back',
  GoForward: 'url_forward',
  Reload: 'url_reload',
} as const;
type ActionEvent = (typeof ActionEvent)[keyof typeof ActionEvent];

export const PreviewMessageSchema = z.object({
  type: z.enum(ReportEvent),
  url: z.string(),
  timestamp: z.number(),
});

export const ActionMessageSchema = z.object({
  type: z.enum(ActionEvent),
  url: z.string(),
  timestamp: z.number(),
});

export interface PreviewMessage {
  type: ReportEvent;
  url: string;
  timestamp: number;
}

export interface ActionMessage {
  type: ActionEvent;
}

export type PreviewBridgeListener = (data: PreviewMessage) => void;
