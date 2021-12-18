import { PanelCfg } from '../../cfg/PanelCfg'
import { clearTimeoutSafe } from '../../core/Util'
import { EventKey } from '../../event/EventKeyEnum'
import { AirLevelChanged, NerpMessage, PlaySoundEvent, RaiderTrainingCompleteEvent } from '../../event/LocalEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { GuiResourceCache } from '../GuiResourceCache'
import { TextInfoMessage } from './TextInfoMessage'
import { TextInfoMessageCfg } from './TextInfoMessageCfg'

export class MessagePanel extends Panel {
    imgAir: SpriteImage = null
    currentMessage: TextInfoMessage = null
    messageTimeout: NodeJS.Timeout = null

    msgSpaceToContinue: TextInfoMessage
    msgAirSupplyLow: TextInfoMessage
    msgAirSupplyRunningOut: TextInfoMessage
    msgGameCompleted: TextInfoMessage
    msgManTrained: TextInfoMessage
    msgUnitUpgraded: TextInfoMessage

    airLevel: number = 1

    constructor(parent: BaseElement, panelCfg: PanelCfg, textInfoMessageConfig: TextInfoMessageCfg) {
        super(parent, panelCfg)
        this.relX = this.xOut = this.xIn = 42
        this.relY = this.yOut = this.yIn = 409
        this.imgAir = GuiResourceCache.getImage('Interface/Airmeter/msgpanel_air_juice.bmp')

        const font = GuiResourceCache.getDefaultFont()
        const crystalFound = new TextInfoMessage(font, textInfoMessageConfig.textCrystalFound, this.img.width)
        this.registerEventListener(EventKey.LOCATION_CRYSTAL_FOUND, () => this.setMessage(crystalFound))
        this.msgSpaceToContinue = new TextInfoMessage(font, textInfoMessageConfig.textSpaceToContinue, this.img.width)
        const cavernDiscovered = new TextInfoMessage(font, textInfoMessageConfig.textCavernDiscovered, this.img.width)
        this.registerEventListener(EventKey.CAVERN_DISCOVERED, () => this.setMessage(cavernDiscovered))
        const oreFound = new TextInfoMessage(font, textInfoMessageConfig.textOreFound, this.img.width)
        this.registerEventListener(EventKey.ORE_FOUND, () => this.setMessage(oreFound))
        this.msgAirSupplyLow = new TextInfoMessage(font, textInfoMessageConfig.textAirSupplyLow, this.img.width)
        this.msgAirSupplyRunningOut = new TextInfoMessage(font, textInfoMessageConfig.textAirSupplyRunningOut, this.img.width)
        this.msgGameCompleted = new TextInfoMessage(font, textInfoMessageConfig.textGameCompleted, this.img.width)
        this.msgManTrained = new TextInfoMessage(font, textInfoMessageConfig.textManTrained, this.img.width)
        this.registerEventListener(EventKey.RAIDER_TRAINING_COMPLETE, (event: RaiderTrainingCompleteEvent) => event.training && this.setMessage(this.msgManTrained))
        this.msgUnitUpgraded = new TextInfoMessage(font, textInfoMessageConfig.textUnitUpgraded, this.img.width)
        this.registerEventListener(EventKey.AIR_LEVEL_CHANGED, (event: AirLevelChanged) => {
            this.airLevel = event.airLevel
            this.notifyRedraw()
        })
        this.registerEventListener(EventKey.NERP_MESSAGE, (event: NerpMessage) => {
            this.setMessage(new TextInfoMessage(font, {text: event.text}, this.img.width))
        })
    }

    reset() {
        super.reset()
        this.airLevel = 1
    }

    setMessage(textInfoMessage: TextInfoMessage, timeout: number = 3000) {
        this.messageTimeout = clearTimeoutSafe(this.messageTimeout)
        this.currentMessage = textInfoMessage
        this.notifyRedraw()
        if (this.currentMessage.sfxSample) this.publishEvent(new PlaySoundEvent(this.currentMessage.sfxSample))
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

    onRedraw(context: SpriteContext) {
        super.onRedraw(context)
        if (this.airLevel > 0) {
            const width = Math.round(236 * this.airLevel)
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
