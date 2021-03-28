import { Button } from '../../base/Button'
import { iGet } from '../../../../core/Util'
import { GameState } from '../../../model/GameState'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { Panel } from './Panel'
import { EventBus } from '../../../../event/EventBus'
import { CollectEvent, SpawnMaterialEvent } from '../../../../event/WorldEvents'
import { CollectableType } from '../../../../scene/model/collect/CollectableEntity'

export class PanelCrystalSideBar extends Panel {

    btnOre: Button
    btnCrystal: Button
    imgNoCrystal
    imgSmallCrystal
    imgUsedCrystal
    imgOre

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg)
        this.btnOre = iGet(this.buttons, 'PanelButton_CrystalSideBar_Ore')
        this.btnOre.label = GameState.numOre.toString()
        this.btnCrystal = iGet(this.buttons, 'PanelButton_CrystalSideBar_Crystals')
        this.btnCrystal.label = GameState.numCrystal.toString()
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
            this.btnOre.label = GameState.numOre.toString()
            this.btnCrystal.label = GameState.numCrystal.toString()
            // TODO implement bricks
            this.notifyRedraw()
        }
    }

    onRedraw(context: CanvasRenderingContext2D) {
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
