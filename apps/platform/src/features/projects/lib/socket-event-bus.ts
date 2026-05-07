type Listener<T = any> = (payload: T) => void;

class SocketEventBus {
  private listeners = new Map<string, Set<Listener>>();

  addListener(namespace: string, listener: Listener) {
    if (!this.listeners.has(namespace)) {
      this.listeners.set(namespace, new Set());
    }

    this.listeners.get(namespace)!.add(listener);

    return () => {
      this.listeners.get(namespace)?.delete(listener);
    };
  }

  emit(namespace: string, payload: any) {
    this.listeners.get(namespace)?.forEach((listener) => {
      listener(payload);
    });
  }
}

export const socketEventBus = new SocketEventBus();
