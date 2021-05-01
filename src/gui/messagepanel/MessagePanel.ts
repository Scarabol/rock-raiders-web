import { PanelCfg } from '../../cfg/PanelCfg'
import { clearTimeoutSafe } from '../../core/Util'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { GameState } from '../../game/model/GameState'
import { ResourceManager } from '../../resource/ResourceManager'
import { Panel } from '../base/Panel'
import { TextInfoMessage } from './TextInfoMessage'
import { TextInfoMessageConfig } from './TextInfoMessageConfig'

export class MessagePanel extends Panel {

    imgAir: HTMLCanvasElement = null
    currentMessage: TextInfoMessage = null
    messageTimeout = null

    msgSpaceToContinue: TextInfoMessage
    msgAirSupplyLow: TextInfoMessage
    msgAirSupplyRunningOut: TextInfoMessage
    msgGameCompleted: TextInfoMessage
    msgManTrained: TextInfoMessage
    msgUnitUpgraded: TextInfoMessage

    constructor(panelCfg: PanelCfg, textInfoMessageConfig: TextInfoMessageConfig) {
        super(panelCfg)
        this.relX = this.xOut = this.xIn = 42
        this.relY = this.yOut = this.yIn = 409
        this.imgAir = ResourceManager.getImage('Interface/Airmeter/msgpanel_air_juice.bmp')

        const font = ResourceManager.getDefaultFont()
        const crystalFound = new TextInfoMessage(font, textInfoMessageConfig.textCrystalFound, this.img.width)
        EventBus.registerEventListener(EventKey.LOCATION_CRYSTAL_FOUND, () => this.setMessage(crystalFound))
        this.msgSpaceToContinue = new TextInfoMessage(font, textInfoMessageConfig.textSpaceToContinue, this.img.width)
        const cavernDiscovered = new TextInfoMessage(font, textInfoMessageConfig.textCavernDiscovered, this.img.width)
        EventBus.registerEventListener(EventKey.CAVERN_DISCOVERED, () => this.setMessage(cavernDiscovered))
        const oreFound = new TextInfoMessage(font, textInfoMessageConfig.textOreFound, this.img.width)
        EventBus.registerEventListener(EventKey.ORE_FOUND, () => this.setMessage(oreFound))
        this.msgAirSupplyLow = new TextInfoMessage(font, textInfoMessageConfig.textAirSupplyLow, this.img.width)
        this.msgAirSupplyRunningOut = new TextInfoMessage(font, textInfoMessageConfig.textAirSupplyRunningOut, this.img.width)
        this.msgGameCompleted = new TextInfoMessage(font, textInfoMessageConfig.textGameCompleted, this.img.width)
        this.msgManTrained = new TextInfoMessage(font, textInfoMessageConfig.textManTrained, this.img.width)
        EventBus.registerEventListener(EventKey.RAIDER_TRAINED, () => this.setMessage(this.msgManTrained))
        this.msgUnitUpgraded = new TextInfoMessage(font, textInfoMessageConfig.textUnitUpgraded, this.img.width)
        EventBus.registerEventListener(EventKey.AIR_LEVEL_CHANGED, () => this.notifyRedraw())
    }

    setMessage(textInfoMessage: TextInfoMessage, timeout: number = 3000) {
        this.messageTimeout = clearTimeoutSafe(this.messageTimeout)
        this.currentMessage = textInfoMessage
        this.notifyRedraw()
        if (timeout) {
            const that = this
            this.messageTimeout = setTimeout(() => {
                that.currentMessage = null
                that.notifyRedraw()
            }, timeout)
        }
    }

    unsetMessage(textInfoMessage: TextInfoMessage) {
        if (this.currentMessage === textInfoMessage) {
            this.currentMessage = null
            this.notifyRedraw()
        }
    }

    onRedraw(context: CanvasRenderingContext2D) {
        super.onRedraw(context)
        if (GameState.airLevel > 0) {
            const width = Math.round(236 * Math.min(1, GameState.airLevel))
            context.drawImage(this.imgAir, this.x + 85, this.y + 6, width, 8)
        }
        const textImage = this.currentMessage?.textImage
        const infoImage = this.currentMessage?.infoImage
        if (textImage) {
            const txtX = this.x + (this.img.width - textImage.width - (infoImage ? infoImage.width : 0)) / 2
            context.drawImage(textImage, txtX, this.y + 26)
        }
        if (infoImage) {
            const infoX = this.x + this.img.width - infoImage.width
            context.drawImage(infoImage, infoX, this.y + 16)
        }
    }

}
