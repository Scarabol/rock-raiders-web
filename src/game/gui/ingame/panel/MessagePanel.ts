import { ResourceManager } from '../../../../resource/ResourceManager';
import { GameState } from '../../../model/GameState';
import { Panel } from './Panel';

export class MessagePanel extends Panel {

    imgAir;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.relX = this.xOut = this.xIn = 42;
        this.relY = this.yOut = this.yIn = 409;
        this.imgAir = ResourceManager.getImage('Interface/Airmeter/msgpanel_air_juice.bmp');
    }

    onRedraw(context: CanvasRenderingContext2D) {
        super.onRedraw(context);
        if (GameState.airlevel > 0) {
            const width = Math.round(236 * GameState.airlevel);
            context.drawImage(this.imgAir, this.x + 85, this.y + 6, width, 8);
        }
    }

}
