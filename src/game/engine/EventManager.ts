export class EventManager {

    cursorX: number = 0; // TODO better center in screen? mobile?
    cursorY: number = 0;
    listeners = {};

    constructor() {
        const eventMgr = this;
        document.addEventListener('mousemove', (event: MouseEvent) => {
            eventMgr.onCursorMove(event);
        });
        this.listeners[EventType.CURSOR_MOVE] = [];
    }

    addEventListener(eventType: EventType, callback: (event: MouseEvent) => any) {
        if (eventType === EventType.CURSOR_MOVE) {
            this.listeners[eventType].push(callback);
        }
    }

    onCursorMove(moveEvent: MouseEvent) {
        // console.log(moveEvent);
        this.cursorX = moveEvent.clientX;
        this.cursorY = moveEvent.clientY;
        this.listeners[EventType.CURSOR_MOVE].forEach(c => c(moveEvent));
    }

}

export enum EventType {

    CURSOR_MOVE,
    CLICK

}
