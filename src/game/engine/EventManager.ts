import { ScreenLayer } from '../../screen/ScreenLayer';

export class EventManager {

    clickListener: { layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => boolean }[] = [];
    moveListener: { layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => any }[] = [];

    constructor() {
        const eventMgr = this;
        document.addEventListener('mousemove', (event: MouseEvent) => {
            eventMgr.moveListener.filter(l => l.layer.isActive())
                .sort((a, b) => a.layer.zIndex === b.layer.zIndex ? 0 : a.layer.zIndex > b.layer.zIndex ? -1 : 1)
                .map(l => l.callback).forEach(c => c(event.clientX, event.clientY));
        });
        document.addEventListener('click', (event: MouseEvent) => {
            eventMgr.clickListener.filter(l => l.layer.isActive())
                .sort((a, b) => a.layer.zIndex === b.layer.zIndex ? 0 : a.layer.zIndex > b.layer.zIndex ? -1 : 1)
                .map(l => l.callback).some(c => c(event.clientX, event.clientY)); // '.some()' breaks when a callback returns true
        });
    }

    addClickEventListener(layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => boolean) {
        this.clickListener.push({layer: layer, callback: callback});
    }

    addMoveEventListener(layer: ScreenLayer, callback: (cursorX: number, cursorY: number) => any) {
        this.moveListener.push({layer: layer, callback: callback});
    }

}
