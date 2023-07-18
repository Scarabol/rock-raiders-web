import { PanelCfg } from '../../cfg/PanelCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { clearTimeoutSafe } from '../../core/Util'
import { EventKey } from '../../event/EventKeyEnum'
import { AirLevelChanged, NerpMessage, RaiderTrainingCompleteEvent, SetSpaceToContinueEvent } from '../../event/LocalEvents'
import { PlaySoundEvent } from '../../event/GuiCommand'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { TextInfoMessage } from './TextInfoMessage'
import { TextInfoMessageCfg } from './TextInfoMessageCfg'
import { AIR_LEVEL_LEVEL_LOW, AIR_LEVEL_WARNING_STEP } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameResultEvent } from '../../event/WorldEvents'
import { GameResultState } from '../../game/model/GameResult'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'

export class MessagePanel extends Panel {
    private readonly maxAirLevelWidth = 236
    readonly textInfoMessageCache: Map<TextInfoMessageEntryCfg, Promise<TextInfoMessage>> = new Map()

    imgAir: SpriteImage = null
    currentMessage: TextInfoMessage = null
    messageTimeout: NodeJS.Timeout = null

    airLevelWidth: number = this.maxAirLevelWidth
    nextAirWarning: number = 1 - AIR_LEVEL_WARNING_STEP

    constructor(parent: BaseElement, panelCfg: PanelCfg, textInfoMessageConfig: TextInfoMessageCfg) {
        super(parent, panelCfg)
        this.relX = this.xOut = this.xIn = 42
        this.relY = this.yOut = this.yIn = 409
        this.imgAir = ResourceManager.getImage('Interface/Airmeter/msgpanel_air_juice.bmp')

        this.registerEventListener(EventKey.LOCATION_CRYSTAL_FOUND, () => this.setMessage(textInfoMessageConfig.textCrystalFound))
        this.registerEventListener(EventKey.CAVERN_DISCOVERED, () => this.setMessage(textInfoMessageConfig.textCavernDiscovered))
        this.registerEventListener(EventKey.ORE_FOUND, () => this.setMessage(textInfoMessageConfig.textOreFound))
        this.registerEventListener(EventKey.AIR_LEVEL_CHANGED, (event: AirLevelChanged) => {
            if (event.airLevel <= 0) return
            const nextAirLevelWidth = Math.round(this.maxAirLevelWidth * event.airLevel)
            if (this.airLevelWidth === nextAirLevelWidth) return
            const nextPercent = nextAirLevelWidth / this.maxAirLevelWidth
            if (nextPercent < this.nextAirWarning) {
                const infoMessageCfg = nextPercent > AIR_LEVEL_LEVEL_LOW ? textInfoMessageConfig.textAirSupplyRunningOut : textInfoMessageConfig.textAirSupplyLow
                this.setMessage(infoMessageCfg)
            }
            this.nextAirWarning = Math.min(1 - AIR_LEVEL_WARNING_STEP, Math.floor(nextAirLevelWidth / this.maxAirLevelWidth / AIR_LEVEL_WARNING_STEP) * AIR_LEVEL_WARNING_STEP)
            this.airLevelWidth = nextAirLevelWidth
            this.notifyRedraw()
        })
        this.registerEventListener(EventKey.GAME_RESULT_STATE, (event: GameResultEvent) => {
            if (event.result === GameResultState.COMPLETE) this.setMessage(textInfoMessageConfig.textGameCompleted)
        })
        this.registerEventListener(EventKey.RAIDER_TRAINING_COMPLETE, (event: RaiderTrainingCompleteEvent) => event.training && this.setMessage(textInfoMessageConfig.textManTrained))
        this.registerEventListener(EventKey.VEHICLE_UPGRADE_COMPLETE, () => this.setMessage(textInfoMessageConfig.textUnitUpgraded))
        this.registerEventListener(EventKey.NERP_MESSAGE, (event: NerpMessage) => {
            this.setMessage({text: event.text}, event.messageTimeoutMs)
        })
        this.registerEventListener(EventKey.SET_SPACE_TO_CONTINUE, (event: SetSpaceToContinueEvent) => {
            if (event.state) {
                this.setMessage(textInfoMessageConfig.textSpaceToContinue, 0)
            } else {
                this.unsetMessage(textInfoMessageConfig.textSpaceToContinue)
            }
        })
    }

    reset() {
        super.reset()
        this.airLevelWidth = this.maxAirLevelWidth
        this.nextAirWarning = 1 - AIR_LEVEL_WARNING_STEP
    }

    private setMessage(cfg: TextInfoMessageEntryCfg, timeout: number = 3000) {
        this.textInfoMessageCache.getOrUpdate(cfg, () => TextInfoMessage.fromConfig(cfg, this.img.width)).then((msg: TextInfoMessage) => {
            this.messageTimeout = clearTimeoutSafe(this.messageTimeout)
            this.currentMessage = msg
            this.notifyRedraw()
            if (this.currentMessage.sfxSample) this.publishEvent(new PlaySoundEvent(this.currentMessage.sfxSample, true))
            if (timeout > 0) {
                const that = this
                this.messageTimeout = setTimeout(() => {
                    that.currentMessage = null
                    that.notifyRedraw()
                }, timeout)
            }
        })
    }

    private unsetMessage(cfg: TextInfoMessageEntryCfg) {
        this.textInfoMessageCache.getOrUpdate(cfg, () => TextInfoMessage.fromConfig(cfg, this.img.width)).then((msg: TextInfoMessage) => {
            if (this.currentMessage === msg) {
                this.currentMessage = null
                this.notifyRedraw()
            }
        })
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
