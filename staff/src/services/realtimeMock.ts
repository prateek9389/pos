// This simulates Firestore's real-time capabilities across browser tabs
// using the native BroadcastChannel API.

export type BroadcastEvent = 
  | { type: 'ORDER_UPDATED'; payload: any }
  | { type: 'ORDER_CREATED'; payload: any };

class RealtimeMockBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: BroadcastEvent) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.channel = new BroadcastChannel('foodie_pos_realtime');
      this.channel.onmessage = (e: MessageEvent<BroadcastEvent>) => {
        this.listeners.forEach(listener => listener(e.data));
      };
    }
  }

  subscribe(listener: (event: BroadcastEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: BroadcastEvent) {
    if (this.channel) {
      this.channel.postMessage(event);
    }
    // Also trigger locally in the same tab
    this.listeners.forEach(listener => listener(event));
  }
}

export const realtimeBus = new RealtimeMockBus();
