import { MainMenuItemCfg } from '../../menu/MainMenuItemCfg';

export class MenuCfg {

    fullName: string = '';
    title: string = '';
    position: [number, number] = [0, 0];
    menuFont: string = '';
    loFont: string = '';
    hiFont: string = '';
    itemCount: number = 0;
    menuImage: string = '';
    autoCenter: boolean = false;
    displayTitle: boolean = false;
    overlays: any[] = [];
    playRandom: boolean = false;
    items: MainMenuItemCfg[] = [];
    anchored: boolean = false;
    canScroll: boolean = false;

    constructor(cfgObj: any) {
        Object.keys(cfgObj).forEach((cfgKey) => {
            const cfgKeyname = (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey).toLowerCase();
            const found = Object.keys(this).some((objKey) => {
                if (objKey.toLowerCase() === cfgKeyname) {
                    this[objKey] = cfgObj[cfgKey];
                    return true;
                } else if (cfgKeyname.match(/item\d+/i)) {
                    this.items.push(new MainMenuItemCfg(cfgObj[cfgKey]));
                    return true;
                } else if (cfgKeyname.match(/overlay\d+/i)) {
                    this.overlays.push(cfgObj[cfgKey]);
                    return true;
                }
            });
            if (!found) {
                console.warn('cfg key does not exist on menu config: ' + cfgKey);
            }
        });
    }

}