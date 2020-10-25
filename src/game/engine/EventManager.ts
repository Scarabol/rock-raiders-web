import { ScreenLayer } from '../../screen/ScreenLayer';

// noinspection JSUnusedGlobalSymbols
export enum MOUSE_BUTTON {

    MAIN = 0,
    MIDDLE = 1,
    SECONDARY = 2

}

export class EventManager {

    cursorMoveListener: CursorMoveListener[] = [];
    mouseDownListener: MouseButtonListener[] = [];
    mouseUpListener: MouseButtonListener[] = [];
    keyListener: KeyListener[] = [];

    constructor() {
        const eventMgr = this;
        document.addEventListener('pointermove', (event: MouseEvent) => {
            event.preventDefault();
            eventMgr.activeAndSorted(eventMgr.cursorMoveListener).forEach(l => {
                const clientRect = l.layer.canvas.getBoundingClientRect();
                l.callback(event.clientX - clientRect.left, event.clientY - clientRect.top);
            });
        });
        document.addEventListener('pointerdown', (event: MouseEvent) => {
            event.preventDefault();
            eventMgr.activeAndSorted(eventMgr.mouseDownListener).some(l => {
                if (l.button === event.button) {
                    const clientRect = l.layer.canvas.getBoundingClientRect();
                    const captured = l.callback(event.clientX - clientRect.left, event.clientY - clientRect.top);
                    if (captured) event.stopPropagation();
                    return captured;
                }
            });
        });
        document.addEventListener('pointerup', (event: MouseEvent) => {
            event.preventDefault();
            eventMgr.activeAndSorted(eventMgr.mouseUpListener).some(l => {
                if (l.button === event.button) {
                    const clientRect = l.layer.canvas.getBoundingClientRect();
                    const captured = l.callback(event.clientX - clientRect.left, event.clientY - clientRect.top);
                    if (captured) event.stopPropagation();
                    return captured;
                }
            });
        });
        window.addEventListener('keydown', (event: KeyboardEvent) => {
            // event.preventDefault(); // otherwise page reload with F5 stops working (may be intended in future)
            eventMgr.activeAndSorted(eventMgr.keyListener).some(l => { // '.some()' breaks when a callback returns true
                const captured = l.callback(event.key);
                if (captured) event.stopPropagation();
                return captured;
            });
        });
    }

    activeAndSorted<T extends BaseListener>(listeners: T[]) {
        return listeners.filter(l => l.layer.isActive()).sort((a, b) => ScreenLayer.compareZ(a.layer, b.layer));
    }

    addCursorMoveListener(layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => any) {
        this.cursorMoveListener.push({layer: layer, callback: callback});
    }

    addMouseDownListener(layer: ScreenLayer, button: MOUSE_BUTTON, callback: (cursorX: number, cursorY: number) => boolean) {
        this.mouseDownListener.push({layer: layer, button: button, callback: callback});
    }

    addMouseUpListener(layer: ScreenLayer, button: MOUSE_BUTTON, callback: (cursorX: number, cursorY: number) => boolean) {
        this.mouseUpListener.push({layer: layer, button: button, callback: callback});
    }

    addKeyEventListener(layer: ScreenLayer, callback: (key: string) => boolean) {
        this.keyListener.push({layer: layer, callback: callback});
    }

}

interface BaseListener {

    layer: ScreenLayer;
    callback: (...any) => any;

}

class CursorMoveListener implements BaseListener {

    layer: ScreenLayer;
    callback: (cursorX: number, cursorY: number) => any;

}

class MouseButtonListener implements BaseListener {

    layer: ScreenLayer;
    button: MOUSE_BUTTON;
    callback: (cursorX: number, cursorY: number) => boolean;

}

class KeyListener implements BaseListener {

    layer: ScreenLayer;
    callback: (key: string) => boolean;

}
