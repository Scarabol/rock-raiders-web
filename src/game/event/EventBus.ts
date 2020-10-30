export class EventBus {

    static eventListener = {};
    static blockedEvents = [];

    static publishEvent(event: GameEvent) {
        if (this.blockedEvents.includes(event.eventKey)) return; // event is currently blocked from publishing
        this.blockedEvents.push(event.eventKey);
        (this.eventListener[event.eventKey] || []).forEach((callback) => callback(event));
        const index = this.blockedEvents.indexOf(event.eventKey);
        if (index > -1) {
            this.blockedEvents.splice(index, 1);
        }
    }

    static registerEventListener(eventKey: string, callback: (GameEvent) => any) {
        this.eventListener[eventKey] = this.eventListener[eventKey] || [];
        this.eventListener[eventKey].push(callback);
    }

}

export class GameEvent {

    eventKey: string;
    isLocal: boolean;

    constructor(eventKey: string) {
        this.eventKey = eventKey;
    }

}
