import { ActionMessage, PreviewBridgeListener, PreviewMessageSchema } from './lib/types.js';

export class PreviewBridgeClient {
  private listeners = new Set<PreviewBridgeListener>();
  private source: MessageEventSource | null = null;

  constructor(private readonly allowedOrigin: string) {
    window.addEventListener('message', this.handler);
  }

  private handler = ({ data, origin, source }: MessageEvent) => {
    if (origin !== this.allowedOrigin) return;

    this.source = source;
    const res = PreviewMessageSchema.safeParse(data);
    if (!res.success) return;

    this.listeners.forEach((listener) => listener(res.data));
  };

  subscribe(listener: PreviewBridgeListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // TODO: add method for performing actions
  action(payload: ActionMessage) {
    console.log('Performing action', payload, this.source);
    this.source?.postMessage(payload, {
      targetOrigin: this.allowedOrigin,
    });
  }

  destroy() {
    window.removeEventListener('message', this.handler);
    this.listeners.clear();
  }
}
