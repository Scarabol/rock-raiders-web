import { ScreenLayer } from '../../screen/ScreenLayer';
import { GameScreen } from '../GameScreen';

export class IngameUI {

    baseLayer: ScreenLayer;

    constructor(screen: GameScreen) {
        this.baseLayer = screen.createLayer({zIndex: 10, alpha: true});
    }

}
