import { EventEmitter } from "events";
import type { Prisma } from "@prisma/client";
import type { SystemEventType, EventPayload } from "./events.types.js";

export type EventHandler = (
  payload: EventPayload,
  tx?: Prisma.TransactionClient
) => void | Promise<void>;

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  override emit(event: SystemEventType, payload?: EventPayload): boolean {
    return super.emit(event, payload ?? {});
  }

  async emitAsync(
    event: SystemEventType,
    payload?: EventPayload,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const p = payload ?? {};
    const handlers = this.listeners(event) as EventHandler[];
    await Promise.all(handlers.map((h) => h(p, tx)));
  }

  override on(event: SystemEventType, handler: EventHandler): this {
    return super.on(event, handler as (...args: unknown[]) => void);
  }
}

export const eventBus = new EventBus();
