import { Rect } from '../core/Rect'
import { BaseConfig } from './BaseConfig'
import { parseLabel } from './CfgHelper'
import { MenuEntryCfg } from './MenuEntryCfg'
import { OverwriteCfg } from './OverwriteCfg'

export class GameMenuCfg extends BaseConfig {
    levelText: LevelTextCfg = new LevelTextCfg()
    pausedMenu: MenuCfg = new MenuCfg()
    saveMenu: MenuCfg = new MenuCfg()
    mainMenuFull: MenuCfg = new MenuCfg()
    optionsMenu: MenuCfg = new MenuCfg()
    saveGame: string = ''
    loadGame: string = ''
    overwrite: OverwriteCfg = new OverwriteCfg()
    saveImage?: {
        BigWidth: number,
        BigHeight: number,
        Width: number,
        Height: number,
        Pos1: number[],
        Pos2: number[],
        Pos3: number[],
        Pos4: number[],
        Pos5: number[],
    }
    saveText: SaveTextCfg = new SaveTextCfg()

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if ('SaveText'.equalsIgnoreCase(unifiedKey)) {
            this.saveText.setFromCfgObj(cfgValue)
        } else if ('LevelText'.equalsIgnoreCase(unifiedKey)) {
            this.levelText.setFromCfgObj(cfgValue)
        } else if ('PausedMenu'.equalsIgnoreCase(unifiedKey)) {
            this.pausedMenu.setFromCfgObj(cfgValue)
            const helpWindowCycle = this.pausedMenu.menus[1].itemsCycle[0]
            ;[helpWindowCycle.labelOn, helpWindowCycle.labelOff] = [helpWindowCycle.labelOff, helpWindowCycle.labelOn] // XXX uplift config parsing workaround
        } else if ('SaveMenu'.equalsIgnoreCase(unifiedKey)) {
            this.saveMenu.setFromCfgObj(cfgValue)
        } else if ('MainMenuFull'.equalsIgnoreCase(unifiedKey)) {
            this.mainMenuFull.setFromCfgObj(cfgValue)
        } else if ('OptionsMenu'.equalsIgnoreCase(unifiedKey)) {
            this.optionsMenu.setFromCfgObj(cfgValue)
            const helpWindowCycle = this.optionsMenu.menus[0].itemsCycle[0]
            ;[helpWindowCycle.labelOn, helpWindowCycle.labelOff] = [helpWindowCycle.labelOff, helpWindowCycle.labelOn] // XXX uplift config parsing workaround
        } else if ('Overwrite'.equalsIgnoreCase(unifiedKey)) {
            this.overwrite.setFromCfgObj(cfgValue)
        } else {
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
        return true
    }

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey === 'savegame' || unifiedKey === 'loadgame') {
            return parseLabel(cfgValue)
        } else {
            return super.parseValue(unifiedKey, cfgValue)
        }
    }
}

export class MenuCfg extends BaseConfig {
    // noinspection JSUnusedGlobalSymbols
    menuCount: number = 0
    menus: MenuEntryCfg[] = []

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (unifiedKey.match(/menu\d+/i)) {
            this.menus.push(new MenuEntryCfg().setFromCfgObj(cfgValue))
            return true
        }
        return super.assignValue(objKey, unifiedKey, cfgValue)
    }
}

class LevelTextCfg extends BaseConfig {
    window: Rect = new Rect()
    panel: MenuPanelCfg = new MenuPanelCfg()
    level?: string
    tutorial?: string

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if ('Window'.equalsIgnoreCase(unifiedKey)) {
            this.window = Rect.fromArray(cfgValue)
        } else if ('Panel'.equalsIgnoreCase(unifiedKey)) {
            this.panel.setFromCfgObj(cfgValue)
        } else {
            return super.assignValue(objKey, unifiedKey, parseLabel(cfgValue))
        }
        return true
    }
}

export class MenuPanelCfg extends BaseConfig {
    imgBackground?: string
    rect: Rect = new Rect()

    setFromCfgObj(cfgObj: any, createMissing: boolean = false): this {
        this.imgBackground = cfgObj[0]
        this.rect.x = cfgObj[1]
        this.rect.y = cfgObj[2]
        this.rect.w = cfgObj[3]
        this.rect.h = cfgObj[4]
        return this
    }
}

export class SaveTextCfg extends BaseConfig {
    window: Rect = new Rect()
    load: string = ''
    save: string = ''
    slot: string = ''

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey === 'window') {
            return Rect.fromArray(cfgValue)
        } else {
            return parseLabel(cfgValue)
        }
    }
}
