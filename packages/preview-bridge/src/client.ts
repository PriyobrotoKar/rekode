import { PreviewBridgeListener, PreviewMessageSchema } from './lib/types.js';

export class PreviewBridgeClient {
  private listeners = new Set<PreviewBridgeListener>();

  constructor(private readonly allowedOrigin: string) {
    window.addEventListener('message', this.handler);
  }

  private handler = ({ data, origin }: MessageEvent) => {
    if (origin !== this.allowedOrigin) return;

    const res = PreviewMessageSchema.safeParse(data);
    if (!res.success) return;

    this.listeners.forEach((listener) => listener(res.data));
  };

  subscribe(listener: PreviewBridgeListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // TODO: add method for performing actions

  destroy() {
    window.removeEventListener('message', this.handler);
    this.listeners.clear();
  }
}
