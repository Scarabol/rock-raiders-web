import { PanelCfg } from '../../cfg/PanelCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { clearTimeoutSafe } from '../../core/Util'
import { EventKey } from '../../event/EventKeyEnum'
import { AirLevelChanged, NerpMessage, RaiderTrainingCompleteEvent } from '../../event/LocalEvents'
import { PlaySoundEvent } from '../../event/GuiCommand'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { TextInfoMessage } from './TextInfoMessage'
import { TextInfoMessageCfg } from './TextInfoMessageCfg'

export class MessagePanel extends Panel {
    private readonly maxAirLevelWidth = 236

    imgAir: SpriteImage = null
    currentMessage: TextInfoMessage = null
    messageTimeout: NodeJS.Timeout = null

    msgSpaceToContinue: TextInfoMessage
    msgAirSupplyLow: TextInfoMessage
    msgAirSupplyRunningOut: TextInfoMessage
    msgGameCompleted: TextInfoMessage
    msgManTrained: TextInfoMessage
    msgUnitUpgraded: TextInfoMessage

    airLevelWidth: number = this.maxAirLevelWidth

    constructor(parent: BaseElement, panelCfg: PanelCfg, textInfoMessageConfig: TextInfoMessageCfg) {
        super(parent, panelCfg)
        this.relX = this.xOut = this.xIn = 42
        this.relY = this.yOut = this.yIn = 409
        this.imgAir = OffscreenCache.getImage('Interface/Airmeter/msgpanel_air_juice.bmp')

        const crystalFound = new TextInfoMessage(textInfoMessageConfig.textCrystalFound, this.img.width)
        this.registerEventListener(EventKey.LOCATION_CRYSTAL_FOUND, () => this.setMessage(crystalFound))
        this.msgSpaceToContinue = new TextInfoMessage(textInfoMessageConfig.textSpaceToContinue, this.img.width)
        const cavernDiscovered = new TextInfoMessage(textInfoMessageConfig.textCavernDiscovered, this.img.width)
        this.registerEventListener(EventKey.CAVERN_DISCOVERED, () => this.setMessage(cavernDiscovered))
        const oreFound = new TextInfoMessage(textInfoMessageConfig.textOreFound, this.img.width)
        this.registerEventListener(EventKey.ORE_FOUND, () => this.setMessage(oreFound))
        this.msgAirSupplyLow = new TextInfoMessage(textInfoMessageConfig.textAirSupplyLow, this.img.width)
        this.msgAirSupplyRunningOut = new TextInfoMessage(textInfoMessageConfig.textAirSupplyRunningOut, this.img.width)
        this.msgGameCompleted = new TextInfoMessage(textInfoMessageConfig.textGameCompleted, this.img.width)
        this.msgManTrained = new TextInfoMessage(textInfoMessageConfig.textManTrained, this.img.width)
        this.registerEventListener(EventKey.RAIDER_TRAINING_COMPLETE, (event: RaiderTrainingCompleteEvent) => event.training && this.setMessage(this.msgManTrained))
        this.registerEventListener(EventKey.VEHICLE_UPGRADE_COMPLETE, () => this.setMessage(this.msgUnitUpgraded))
        this.msgUnitUpgraded = new TextInfoMessage(textInfoMessageConfig.textUnitUpgraded, this.img.width)
        this.registerEventListener(EventKey.AIR_LEVEL_CHANGED, (event: AirLevelChanged) => {
            if (event.airLevel > 0) {
                const nextAirLevelWidth = Math.round(this.maxAirLevelWidth * event.airLevel)
                if (this.airLevelWidth !== nextAirLevelWidth) {
                    this.airLevelWidth = nextAirLevelWidth
                    this.notifyRedraw()
                }
            }
        })
        this.registerEventListener(EventKey.NERP_MESSAGE, (event: NerpMessage) => {
            this.setMessage(new TextInfoMessage({text: event.text}, this.img.width))
        })
    }

    reset() {
        super.reset()
        this.airLevelWidth = this.maxAirLevelWidth
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
        context.drawImage(this.imgAir, this.x + 85, this.y + 6, this.airLevelWidth, 8)
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
