import { EventName, EventPayloads } from '../../shared/types/index';

type EventHandler<T> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();

  /**
   * Subscribes to an event with a handler.
   */
  on<K extends EventName>(event: K, handler: EventHandler<EventPayloads[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(handler);
  }

  /**
   * Unsubscribes an event handler.
   */
  off<K extends EventName>(event: K, handler: EventHandler<EventPayloads[K]>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Subscribes to an event once. The handler will be removed after the first execution.
   */
  once<K extends EventName>(event: K, handler: EventHandler<EventPayloads[K]>): void {
    const wrapper: EventHandler<EventPayloads[K]> = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    this.on(event, wrapper);
  }

  /**
   * Emits an event with a payload, calling all registered handlers.
   */
  emit<K extends EventName>(event: K, payload: EventPayloads[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Iterate over a copy to avoid issues if handlers modify the Set during execution
    for (const handler of Array.from(handlers)) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in event handler for event "${event}":`, error);
      }
    }
  }

  /**
   * Removes all listeners for all events.
   */
  clear(): void {
    this.listeners.clear();
  }
}
