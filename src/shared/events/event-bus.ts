/**
 * @file src/shared/events/event-bus.ts
 * @purpose Domain Event Bus: Typed in-process pub/sub for decoupled cross-module communication (orders, stock, loyalty, store config).
 */

/**
 * Typed Domain Event Bus for cross-module communication.
 * Modules emit and subscribe to events without importing each other's internals.
 */

export interface DomainEventMap {
  "order.created": {
    storeId: string;
    orderId: string;
    orderNumber: string;
    userId?: string;
    total: number;
    customerPhone: string;
  };
  "order.status_changed": {
    storeId: string;
    orderId: string;
    previousStatus: string;
    nextStatus: string;
  };
  "stock.decremented": {
    storeId: string;
    variantId: string;
    quantity: number;
    remainingStock: number;
  };
  "loyalty.points_awarded": {
    storeId: string;
    userId: string;
    points: number;
    reason: string;
  };
  "store.config_updated": {
    storeId: string;
  };
}

export type DomainEventName = keyof DomainEventMap;

type EventHandler<K extends DomainEventName> = (
  payload: DomainEventMap[K]
) => void | Promise<void>;

class TypedEventBus {
  private listeners = new Map<DomainEventName, Set<EventHandler<never>>>();

  on<K extends DomainEventName>(
    event: K,
    handler: EventHandler<K>
  ): () => void {
    const existing = this.listeners.get(event) ?? new Set<EventHandler<never>>();
    existing.add(handler as EventHandler<never>);
    this.listeners.set(event, existing);

    return () => {
      existing.delete(handler as EventHandler<never>);
    };
  }

  async emit<K extends DomainEventName>(
    event: K,
    payload: DomainEventMap[K]
  ): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    const tasks = Array.from(handlers).map((handler) =>
      Promise.resolve((handler as EventHandler<K>)(payload))
    );
    await Promise.allSettled(tasks);
  }
}

export const eventBus = new TypedEventBus();
