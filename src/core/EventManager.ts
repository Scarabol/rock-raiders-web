import { ScreenLayer } from '../screen/ScreenLayer';
import { BaseScreen } from '../screen/BaseScreen';

// noinspection JSUnusedGlobalSymbols
export enum MOUSE_BUTTON {

    MAIN = 0,
    MIDDLE = 1,
    SECONDARY = 2

}

export class EventManager {

    constructor(screen: BaseScreen) {
        screen.gameCanvasContainer.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault(); // TODO only prevent default, when over canvas
        });
        ['pointermove', 'pointerdown', 'pointerup']
            .forEach((eventType) => {
                screen.gameCanvasContainer.addEventListener(eventType, (event: PointerEvent) => {
                    // all event attibutes used by controls: clientX, clientY, deltaY, keyCode, touches, pointerType, button, ctrlKey, metaKey, shiftKey
                    const nonBubblingClone = new PointerEvent(event.type, {
                        bubbles: false, // disable bubbling otherwise we'll trigger this same event handler again
                        clientX: event.clientX,
                        clientY: event.clientY,
                        pointerType: event.pointerType,
                        button: event.button,
                        ctrlKey: event.ctrlKey,
                        metaKey: event.metaKey,
                        shiftKey: event.shiftKey,
                    });
                    screen.layers.filter(l => l.isActive())
                        .sort((a, b) => ScreenLayer.compareZ(a, b))
                        .some(l => l.handlePointerEvent(eventType, nonBubblingClone));
                });
            });
        ['keydown', 'keyup']
            .forEach((eventType) => {
                screen.gameCanvasContainer.addEventListener(eventType, (event: KeyboardEvent) => {
                    // event.preventDefault(); // otherwise page reload with F5 stops working (may be intended in future)
                    screen.layers.filter(l => l.isActive())
                        .sort((a, b) => ScreenLayer.compareZ(a, b))
                        .some(l => l.handleKeyEvent(eventType, event));
                });
            });
        screen.gameCanvasContainer.addEventListener('wheel', (event: WheelEvent) => {
            // all event attibutes used by controls: clientX, clientY, deltaY, keyCode, touches, pointerType, button, ctrlKey, metaKey, shiftKey
            const nonBubblingClone = new WheelEvent(event.type, {
                bubbles: false, // disable bubbling otherwise we'll trigger this same event handler again
                clientX: event.clientX,
                clientY: event.clientY,
                deltaX: event.deltaX,
                deltaY: event.deltaY,
                deltaZ: event.deltaZ,
                button: event.button,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
            });
            screen.layers.filter(l => l.isActive())
                .sort((a, b) => ScreenLayer.compareZ(a, b))
                .some(l => l.handleWheelEvent('wheel', nonBubblingClone));
        });
    }

}
