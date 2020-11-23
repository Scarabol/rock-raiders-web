export class MainMenuItemCfg {

    actionName: string;
    x: number;
    y: number;
    label: string;
    imgNormal: string;
    imgHover: string;
    imgPressed: string;
    tooltip: string;
    target: string;

    constructor(cfgObj: any) {
        this.actionName = cfgObj[0];
        this.x = Number(cfgObj[1]);
        this.y = Number(cfgObj[2]);
        if (cfgObj.length === 5) {
            this.label = cfgObj[3].replace(/_/g, ' ');
        } else if (cfgObj.length === 8) {
            this.imgNormal = cfgObj[3];
            this.imgHover = cfgObj[4];
            this.imgPressed = cfgObj[5];
            this.tooltip = cfgObj[6];
        } else {
            console.warn('Unexpected cfg object length: ' + cfgObj.length);
        }
        this.target = cfgObj[cfgObj.length - 1];
    }

}