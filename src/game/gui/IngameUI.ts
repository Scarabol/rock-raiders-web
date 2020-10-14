import { ScreenLayer } from '../../screen/ScreenLayer';
import { GameScreen } from '../GameScreen';
import { EventType } from '../engine/EventManager';

export class IngameUI {

    baseLayer: ScreenLayer;

    constructor(screen: GameScreen) {
        this.baseLayer = screen.createLayer({zIndex: 10, alpha: true});

        screen.eventMgr.addEventListener(EventType.CURSOR_MOVE, this.baseLayer, this.drawCursor);
    }

    drawCursor(event) {
        console.log('draw ingame cursor');
        // console.log(event);
        return false;
    }

}
