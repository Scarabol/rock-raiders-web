import { EventTypeMap } from './EventTypeMap'

// Inspired by https://github.com/nijatismayilov/typescript-eventbus

class Observer<EventType extends keyof EventTypeMap> {
    private listeners: ((e: EventTypeMap[EventType]) => void)[] = []

    subscribe(listener: (e: EventTypeMap[EventType]) => void): () => void {
        this.listeners = [...this.listeners, listener]
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener)
        }
    }

    publish(event: EventTypeMap[EventType]): void {
        for (const listener of this.listeners) listener(event)
    }
}

export class EventBroker {
    private static instance: EventBroker = new EventBroker()
    private observers: {
        [Type in keyof EventTypeMap]?: Observer<Type>;
    } = {}
    private readonly blockedEvents: Set<keyof EventTypeMap> = new Set<keyof EventTypeMap>()

    static publish<Type extends keyof EventTypeMap>(event: EventTypeMap[Type]): void {
        if (!this.instance.observers[event.type]) {
            this.instance.observers = {
                ...this.instance.observers,
                [event.type]: new Observer<Type>(),
            }
        }
        if (this.instance.blockedEvents.has(event.type)) return // event is currently blocked from publishing
        this.instance.blockedEvents.add(event.type)
        try {
            // @ts-ignore
            this.instance.observers[event.type].publish(event)
        } finally {
            this.instance.blockedEvents.delete(event.type)
        }
    }

    static subscribe<Type extends keyof EventTypeMap>(
        type: Type,
        listener: (e: EventTypeMap[Type]) => void
    ): () => void {
        if (!this.instance.observers[type]) {
            this.instance.observers = {
                ...this.instance.observers,
                [type]: new Observer<Type>(),
            }
        }
        const observer = this.instance.observers[type]
        if (!observer) throw new Error(`Failed to initialize event observer for "${String(type)}"`)
        return observer.subscribe(listener)
    }

    static init() {
        this.instance = new EventBroker()
    }
}
