import { MenuCfg } from './MenuCfg';

export class MainMenuFullCfg {

    menuCount: number = 0;
    menus: MenuCfg[] = [];

    constructor(cfgObj: any) {
        Object.keys(cfgObj).forEach((cfgKey) => {
            const cfgKeyname = (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey).toLowerCase();
            const found = Object.keys(this).some((objKey) => {
                if (objKey.toLowerCase() === cfgKeyname) {
                    this[objKey] = cfgObj[cfgKey];
                    return true;
                } else if (cfgKeyname.startsWith('menu')) {
                    this.menus.push(new MenuCfg(cfgObj[cfgKey]));
                    return true;
                }
            });
            if (!found) {
                console.warn('cfg key does not exist on menu full config: ' + cfgKey);
            }
        });
    }

}