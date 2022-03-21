import { ButtonCrystalSideBarCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { MaterialAmountChanged, UsedCrystalsChanged } from '../../event/WorldEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { GuiResourceCache } from '../GuiResourceCache'
import { SideBarLabel } from './SideBarLabel'
import { NeededCrystalsChanged } from '../../event/LocalEvents'

export class PanelCrystalSideBar extends Panel {
    labelOre: SideBarLabel
    labelCrystal: SideBarLabel
    imgNoCrystal: SpriteImage
    imgSmallCrystal: SpriteImage
    imgUsedCrystal: SpriteImage
    imgOre: SpriteImage

    numCrystal: number = 0
    usedCrystals: number = 0
    neededCrystals: number = 0
    totalOre: number = 0

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonCrystalSideBarCfg) {
        super(parent, panelCfg)
        this.labelOre = this.addChild(new SideBarLabel(this, buttonsCfg.panelButtonCrystalSideBarOre))
        this.labelCrystal = this.addChild(new SideBarLabel(this, buttonsCfg.panelButtonCrystalSideBarCrystals))
        this.imgNoCrystal = GuiResourceCache.getImage('Interface/RightPanel/NoSmallCrystal.bmp')
        this.imgSmallCrystal = GuiResourceCache.getImage('Interface/RightPanel/SmallCrystal.bmp')
        this.imgUsedCrystal = GuiResourceCache.getImage('Interface/RightPanel/UsedCrystal.bmp')
        this.imgOre = GuiResourceCache.getImage('Interface/RightPanel/CrystalSideBar_Ore.bmp')
        this.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, (event: MaterialAmountChanged) => {
            this.labelOre.label = event.totalOre.toString()
            this.labelCrystal.label = event.numCrystal.toString()
            this.numCrystal = event.numCrystal
            this.totalOre = event.totalOre
            this.notifyRedraw()
        })
        this.registerEventListener(EventKey.USED_CRYSTALS_CHANGED, (event: UsedCrystalsChanged) => {
            this.usedCrystals = event.usedCrystals
        })
        this.registerEventListener(EventKey.NEEDED_CRYSTALS_CHANGED, (event: NeededCrystalsChanged) => {
            this.neededCrystals = event.neededCrystals
        })
    }

    reset() {
        super.reset()
        this.numCrystal = 0
        this.usedCrystals = 0
        this.neededCrystals = 0
        this.totalOre = 0
    }

    onRedraw(context: SpriteContext) {
        super.onRedraw(context)
        // draw crystals
        let curX = this.x + this.img.width - 8
        let curY = this.y + this.img.height - 34
        for (let c = 0; (this.neededCrystals < 1 || c < Math.max(this.neededCrystals, this.numCrystal)) && curY >= Math.max(this.imgNoCrystal.height, this.imgSmallCrystal.height, this.imgUsedCrystal.height); c++) {
            let imgCrystal = this.imgNoCrystal
            if (this.usedCrystals > c) {
                imgCrystal = this.imgUsedCrystal
            } else if (this.numCrystal > c) {
                imgCrystal = this.imgSmallCrystal
            }
            curY -= imgCrystal.height
            context.drawImage(imgCrystal, curX - imgCrystal.width / 2, curY)
        }
        // draw ores
        curX = this.x + this.img.width - 21
        curY = this.y + this.img.height - 42
        for (let i = 0; i < this.totalOre && curY >= this.imgOre.height; ++i) {
            curY -= this.imgOre.height
            context.drawImage(this.imgOre, curX - this.imgOre.width / 2, curY)
        }
    }
}
