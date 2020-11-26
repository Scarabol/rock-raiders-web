import { ResourceManager } from '../resource/ResourceManager';
import { MainMenuBaseItem } from './MainMenuBaseItem';

export class RewardScreenButton extends MainMenuBaseItem {

    imgNormal: HTMLCanvasElement;
    imgHover: HTMLCanvasElement;
    imgPressed: HTMLCanvasElement;
    imgDisabled: HTMLCanvasElement;
    disabled: boolean = false;
    visible: boolean = true;

    constructor(conf: any) {
        super();
        let imgNormalFilepath, imgHoverFilepath, imgPressedFilepath, imgDisabledFilepath;
        [imgNormalFilepath, imgHoverFilepath, imgPressedFilepath, imgDisabledFilepath, this.x, this.y] = conf;
        this.imgNormal = ResourceManager.getImage(imgNormalFilepath);
        this.imgHover = ResourceManager.getImage(imgHoverFilepath);
        this.imgPressed = ResourceManager.getImage(imgPressedFilepath);
        this.imgDisabled = ResourceManager.getImage(imgDisabledFilepath);
        this.width = this.imgNormal.width;
        this.height = this.imgNormal.height;
    }

    draw(context: CanvasRenderingContext2D) {
        super.draw(context);
        if (!this.visible) return;
        let img = this.imgNormal;
        if (this.disabled) {
            img = this.imgDisabled;
        } else if (this.pressed) {
            img = this.imgPressed;
        } else if (this.hover) {
            img = this.imgHover;
        }
        context.drawImage(img, this.x, this.y);
    }

}