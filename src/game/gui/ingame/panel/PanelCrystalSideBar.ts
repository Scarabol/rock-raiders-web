import { GameState } from '../../../model/GameState'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { Panel } from './Panel'
import { EventBus } from '../../../../event/EventBus'
import { CollectEvent, SpawnMaterialEvent } from '../../../../event/WorldEvents'
import { CollectableType } from '../../../../scene/model/collect/CollectableEntity'
import { PanelCfg } from '../../../../cfg/PanelsCfg'
import { BaseConfig } from '../../../../cfg/BaseConfig'
import { ButtonCfg } from '../../../../cfg/ButtonsCfg'
import { Label } from '../../base/Label'

export class PanelCrystalSideBar extends Panel {

    labelOre: Label
    labelCrystal: Label
    imgNoCrystal: HTMLCanvasElement
    imgSmallCrystal: HTMLCanvasElement
    imgUsedCrystal: HTMLCanvasElement
    imgOre: HTMLCanvasElement

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonCrystalSideBarCfg) {
        super(panelCfg)
        this.labelOre = this.addChild(new Label(this, buttonsCfg.panelButtonCrystalSideBarOre, GameState.numOre.toString())) // TODO include number of bricks
        this.labelCrystal = this.addChild(new Label(this, buttonsCfg.panelButtonCrystalSideBarCrystals, GameState.numCrystal.toString()))
        this.imgNoCrystal = ResourceManager.getImage('Interface/RightPanel/NoSmallCrystal.bmp')
        this.imgSmallCrystal = ResourceManager.getImage('Interface/RightPanel/SmallCrystal.bmp')
        this.imgUsedCrystal = ResourceManager.getImage('Interface/RightPanel/UsedCrystal.bmp')
        this.imgOre = ResourceManager.getImage('Interface/RightPanel/CrystalSideBar_Ore.bmp')
        EventBus.registerEventListener(CollectEvent.eventKey, (event: CollectEvent) => {
            this.updateQuantities(event.collectType)
        })
        EventBus.registerEventListener(SpawnMaterialEvent.eventKey, (event: SpawnMaterialEvent) => {
            this.updateQuantities(event.collectable.getCollectableType())
        })
    }

    updateQuantities(type: CollectableType) {
        if (type === CollectableType.CRYSTAL || type === CollectableType.ORE || type === CollectableType.BRICK) {
            this.notifyRedraw() // TODO performance: only redraw this panel
        }
    }

    onRedraw(context: CanvasRenderingContext2D) {
        this.labelOre.label = GameState.numOre.toString() // TODO include number of bricks
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
