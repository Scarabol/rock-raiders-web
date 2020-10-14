import { ScreenLayer } from '../../screen/ScreenLayer';

export class EventManager {

    moveListener: MoveListener[] = [];
    clickListener: ClickListener[] = [];

    constructor() {
        const eventMgr = this;
        document.addEventListener('mousemove', (event: MouseEvent) => {
            eventMgr.activeAndSorted(eventMgr.moveListener).forEach(l => {
                const clientRect = l.layer.canvas.getBoundingClientRect();
                l.callback(event.clientX - clientRect.left, event.clientY - clientRect.top);
            });
        });
        document.addEventListener('click', (event: MouseEvent) => {
            eventMgr.activeAndSorted(eventMgr.clickListener).some(l => { // '.some()' breaks when a callback returns true
                const clientRect = l.layer.canvas.getBoundingClientRect();
                return l.callback(event.clientX - clientRect.left, event.clientY - clientRect.top);
            });
        });
    }

    activeAndSorted(listeners: { layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => any }[]) {
        return listeners.filter(l => l.layer.isActive())
            .sort((a, b) => a.layer.zIndex === b.layer.zIndex ? 0 : a.layer.zIndex > b.layer.zIndex ? -1 : 1);
    }

    addMoveEventListener(layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => any) {
        this.moveListener.push({layer: layer, callback: callback});
    }

    addClickEventListener(layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => boolean) {
        this.clickListener.push({layer: layer, callback: callback});
    }

}

class MoveListener {

    layer: ScreenLayer;
    callback: (cursorX: number, cursorY: number) => any;

}

class ClickListener {

    layer: ScreenLayer;
    callback: (cursorX: number, cursorY: number) => boolean;

}
