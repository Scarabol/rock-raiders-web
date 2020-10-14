import { ScreenLayer } from '../../screen/ScreenLayer';

export class EventManager {

    cursorX: number = 0; // TODO better center in screen? mobile?
    cursorY: number = 0;
    listeners = {};

    constructor() {
        const eventMgr = this;
        document.addEventListener('mousemove', (event: MouseEvent) => eventMgr.onCursorMove(event));
        document.addEventListener('click', (event: MouseEvent) => eventMgr.onClick(event));
    }

    getListener(eventType: EventType) {
        this.listeners[eventType] = this.listeners[eventType] || [];
        return this.listeners[eventType];
    }

    addEventListener(eventType: EventType, layer: ScreenLayer, callback: (event: MouseEvent) => boolean) {
        this.getListener(eventType).push({layer: layer, callback: callback});
    }

    publishEvent(eventType: EventType, event: MouseEvent) {
        this.getListener(eventType).filter(l => l.layer.isActive())
            .sort((a, b) => a.layer.zIndex === b.layer.zIndex ? 0 : a.layer.zIndex > b.layer.zIndex ? -1 : 1)
            .map(l => l.callback).some(c => c(event)); // '.some()' breaks when a callback returns true
    }

    onCursorMove(event: MouseEvent) {
        this.cursorX = event.clientX;
        this.cursorY = event.clientY;
        this.publishEvent(EventType.CURSOR_MOVE, event);
    }

    onClick(event: MouseEvent) {
        this.publishEvent(EventType.CLICK, event);
    }

}

export enum EventType {

    CURSOR_MOVE,
    CLICK

}
