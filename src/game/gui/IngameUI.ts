import { ScreenLayer } from '../../screen/ScreenLayer';
import { GameScreen } from '../GameScreen';

export class IngameUI {

    baseLayer: ScreenLayer;

    constructor(screen: GameScreen) {
        this.baseLayer = screen.createLayer({zIndex: 10, alpha: true});

        screen.eventMgr.addMoveEventListener(this.baseLayer, this.drawCursor);
    }

    drawCursor(event) {
        // console.log('draw ingame cursor');
        // console.log(event);
    }

}
