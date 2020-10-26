import { ResourceManager } from '../game/engine/ResourceManager';

export class Panel {

    name: string;
    img;
    x: number;
    y: number;
    xIn: number;
    yIn: number;
    xOut: number;
    yOut: number;
    hidden: boolean;

    constructor(panelName: string, cfgEntry: any) {
        this.name = panelName;
        let imgName;
        [imgName, this.xOut, this.yOut, this.xIn, this.yIn] = cfgEntry;
        this.img = ResourceManager.getImage(imgName);
        if (panelName === 'Panel_Messages') { // TODO no position given for this panel???
            this.xIn = 42;
            this.yIn = 409;
        }
        this.toggle();
        if (panelName === 'Panel_RadarOverlay' || panelName === 'Panel_Information') {
            this.hidden = true;
        }
    }

    toggle() {
        this.x = this.x === this.xIn ? this.xOut : this.xIn;
        this.y = this.y === this.yIn ? this.yOut : this.yIn;
    }

    redraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return;
        context.drawImage(this.img, this.x, this.y);
    }

}
