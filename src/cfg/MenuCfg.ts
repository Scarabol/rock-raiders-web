import { Rect } from '../core/Rect'
import { MenuEntryCfg } from './MenuEntryCfg'
import { OverwriteCfg } from './OverwriteCfg'
import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class GameMenuCfg implements ConfigSetFromRecord {
    levelText: LevelTextCfg = new LevelTextCfg()
    pausedMenu: MenuCfg = new MenuCfg()
    saveMenu: MenuCfg = new MenuCfg()
    mainMenuFull: MenuCfg = new MenuCfg()
    optionsMenu: MenuCfg = new MenuCfg()
    saveGame: string = ''
    loadGame: string = ''
    overwrite: OverwriteCfg = new OverwriteCfg()
    saveImage: SaveImageCfg = new SaveImageCfg()
    saveText: SaveTextCfg = new SaveTextCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.levelText.setFromRecord(cfgValue.getRecord('LevelText'))
        this.pausedMenu.setFromRecord(cfgValue.getRecord('PausedMenu'))
        this.saveMenu.setFromRecord(cfgValue.getRecord('SaveMenu'))
        this.mainMenuFull.setFromRecord(cfgValue.getRecord('MainMenuFull'))
        this.optionsMenu.setFromRecord(cfgValue.getRecord('OptionsMenu'))
        this.saveGame = cfgValue.getValue('Save_Game').toLabel()
        this.loadGame = cfgValue.getValue('Load_Game').toLabel()
        this.overwrite.setFromRecord(cfgValue.getRecord('Overwrite'))
        this.saveImage.setFromRecord(cfgValue.getRecord('SaveImage'))
        this.saveText.setFromRecord(cfgValue.getRecord('SaveText'))
        return this
    }
}

export class MenuCfg implements ConfigSetFromRecord {
    // noinspection JSUnusedGlobalSymbols
    menuCount: number = 0
    menus: MenuEntryCfg[] = []

    setFromRecord(cfgValue: CfgEntry): this {
        this.menuCount = cfgValue.getValue('MenuCount').toNumber()
        cfgValue.forEachEntry((key, value) => {
            if (key.match(/Menu\d+/i)) {
                this.menus.push(new MenuEntryCfg().setFromRecord(value))
            }
        })
        return this
    }
}

class LevelTextCfg implements ConfigSetFromRecord {
    window: Rect = new Rect()
    panel: MenuPanelCfg = new MenuPanelCfg()
    level: string = ''
    tutorial: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.window = Rect.fromArray(cfgValue.getValue('Window').toArray('|', 4).map((v) => v.toNumber()))
        this.panel.setFromValue(cfgValue.getValue('Panel'))
        this.level = cfgValue.getValue('Level').toLabel()
        this.tutorial = cfgValue.getValue('Tutorial').toLabel()
        return this
    }
}

export class MenuPanelCfg implements ConfigSetFromEntryValue {
    imgBackground: string = ''
    rect: Rect = new Rect()

    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toArray('|', 5)
        this.imgBackground = value[0].toFileName()
        this.rect.x = value[1].toNumber()
        this.rect.y = value[2].toNumber()
        this.rect.w = value[3].toNumber()
        this.rect.h = value[4].toNumber()
        return this
    }
}

export class SaveImageCfg implements ConfigSetFromRecord {
    bigWidth: number = 0
    bigHeight: number = 0
    width: number = 0
    height: number = 0
    pos1: { x: number, y: number } = {x: 0, y: 0}
    pos2: { x: number, y: number } = {x: 0, y: 0}
    pos3: { x: number, y: number } = {x: 0, y: 0}
    pos4: { x: number, y: number } = {x: 0, y: 0}
    pos5: { x: number, y: number } = {x: 0, y: 0}

    setFromRecord(cfgValue: CfgEntry): this {
        this.bigWidth = cfgValue.getValue('BigWidth').toNumber()
        this.bigHeight = cfgValue.getValue('BigHeight').toNumber()
        this.width = cfgValue.getValue('Width').toNumber()
        this.height = cfgValue.getValue('Height').toNumber()
        this.pos1 = cfgValue.getValue('Pos1').toPos('|')
        this.pos2 = cfgValue.getValue('Pos2').toPos('|')
        this.pos3 = cfgValue.getValue('Pos3').toPos('|')
        this.pos4 = cfgValue.getValue('Pos4').toPos('|')
        this.pos5 = cfgValue.getValue('Pos5').toPos('|')
        return this
    }
}

export class SaveTextCfg implements ConfigSetFromRecord {
    window: Rect = new Rect()
    load: string = ''
    save: string = ''
    slot: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.window = Rect.fromArray(cfgValue.getValue('Window').toArray('|', 4).map((v) => v.toNumber()))
        this.load = cfgValue.getValue('Load').toLabel()
        this.save = cfgValue.getValue('Save').toLabel()
        this.slot = cfgValue.getValue('Slot').toLabel()
        return this
    }
}
