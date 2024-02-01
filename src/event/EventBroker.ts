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
        this.listeners.forEach((listener) => listener(event))
    }
}

export class EventBroker {
    private static instance: EventBroker = new EventBroker()
    private observers: {
        [Type in keyof EventTypeMap]?: Observer<Type>;
    } = {}
    private static readonly blockedEvents: Set<keyof EventTypeMap> = new Set<keyof EventTypeMap>()

    public static publish<Type extends keyof EventTypeMap>(event: EventTypeMap[Type]): void {
        if (!this.instance.observers[event.type]) {
            this.instance.observers = {
                ...this.instance.observers,
                [event.type]: new Observer<Type>(),
            }
        }
        if (this.blockedEvents.has(event.type)) return // event is currently blocked from publishing
        this.blockedEvents.add(event.type)
        // @ts-ignore
        this.instance.observers[event.type].publish(event)
        this.blockedEvents.delete(event.type)
    }

    public static subscribe<Type extends keyof EventTypeMap>(
        type: Type,
        listener: (e: EventTypeMap[Type]) => void
    ): () => void {
        if (!this.instance.observers[type]) {
            this.instance.observers = {
                ...this.instance.observers,
                [type]: new Observer<Type>(),
            }
        }
        return this.instance.observers[type].subscribe(listener)
    }
}
