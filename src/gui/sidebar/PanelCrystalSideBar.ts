import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { EntityType } from '../../game/model/EntityType'
import { GameState } from '../../game/model/GameState'
import { ResourceManager } from '../../resource/ResourceManager'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { SideBarLabel } from './SideBarLabel'

export class PanelCrystalSideBar extends Panel {

    labelOre: SideBarLabel
    labelCrystal: SideBarLabel
    imgNoCrystal: HTMLCanvasElement
    imgSmallCrystal: HTMLCanvasElement
    imgUsedCrystal: HTMLCanvasElement
    imgOre: HTMLCanvasElement

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonCrystalSideBarCfg) {
        super(parent, panelCfg)
        this.labelOre = this.addChild(new SideBarLabel(this, buttonsCfg.panelButtonCrystalSideBarOre, GameState.totalOre.toString()))
        this.labelCrystal = this.addChild(new SideBarLabel(this, buttonsCfg.panelButtonCrystalSideBarCrystals, GameState.numCrystal.toString()))
        this.imgNoCrystal = ResourceManager.getImage('Interface/RightPanel/NoSmallCrystal.bmp')
        this.imgSmallCrystal = ResourceManager.getImage('Interface/RightPanel/SmallCrystal.bmp')
        this.imgUsedCrystal = ResourceManager.getImage('Interface/RightPanel/UsedCrystal.bmp')
        this.imgOre = ResourceManager.getImage('Interface/RightPanel/CrystalSideBar_Ore.bmp')
        this.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, (event: MaterialAmountChanged) => {
            if (event.entityType === EntityType.CRYSTAL || event.entityType === EntityType.ORE || event.entityType === EntityType.BRICK) {
                this.notifyRedraw()
            }
        })
    }

    onRedraw(context: CanvasRenderingContext2D) {
        this.labelOre.label = GameState.totalOre.toString()
        this.labelCrystal.label = GameState.numCrystal.toString()
        super.onRedraw(context)
        // draw crystals
        let curX = this.x + this.img.width - 8
        let curY = this.y + this.img.height - 34
        for (let c = 0; (GameState.neededCrystals < 1 || c < Math.max(GameState.neededCrystals, GameState.numCrystal)) && curY >= Math.max(this.imgNoCrystal.height, this.imgSmallCrystal.height, this.imgUsedCrystal.height); c++) {
            let imgCrystal = this.imgNoCrystal
            if (GameState.usedCrystals > c) {
                imgCrystal = this.imgUsedCrystal
            } else if (GameState.numCrystal > c) {
                imgCrystal = this.imgSmallCrystal
            }
            curY -= imgCrystal.height
            context.drawImage(imgCrystal, curX - imgCrystal.width / 2, curY)
        }
        // draw ores
        curX = this.x + this.img.width - 21
        curY = this.y + this.img.height - 42
        for (let i = 0; i < GameState.numOre && curY >= this.imgOre.height; ++i) {
            curY -= this.imgOre.height
            context.drawImage(this.imgOre, curX - this.imgOre.width / 2, curY)
        }
    }

}

export class ButtonCrystalSideBarCfg extends BaseConfig {

    panelButtonCrystalSideBarOre: ButtonCfg = null
    panelButtonCrystalSideBarCrystals: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }

}
