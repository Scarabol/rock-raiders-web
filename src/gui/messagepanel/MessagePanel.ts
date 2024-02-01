import { PanelCfg } from '../../cfg/PanelCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { clearIntervalSafe, clearTimeoutSafe } from '../../core/Util'
import { EventKey } from '../../event/EventKeyEnum'
import { RaiderTrainingCompleteEvent, SetSpaceToContinueEvent } from '../../event/LocalEvents'
import { PlaySoundEvent } from '../../event/GuiCommand'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { TextInfoMessage } from './TextInfoMessage'
import { TextInfoMessageCfg } from './TextInfoMessageCfg'
import { AIR_LEVEL_LEVEL_LOW, AIR_LEVEL_WARNING_STEP } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { AirLevelChanged, GameResultEvent, NerpMessageEvent } from '../../event/WorldEvents'
import { GameResultState } from '../../game/model/GameResult'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'
import { GameConfig } from '../../cfg/GameConfig'

export class MessagePanel extends Panel {
    private readonly maxAirLevelWidth = 236
    readonly textInfoMessageCache: Map<TextInfoMessageEntryCfg, Promise<TextInfoMessage>> = new Map()

    imgAir: SpriteImage = null
    imgNoAir: SpriteImage = null
    currentMessage: TextInfoMessage = null
    messageTimeout: NodeJS.Timeout = null

    airLevelWidth: number = this.maxAirLevelWidth
    nextAirWarning: number = 1 - AIR_LEVEL_WARNING_STEP
    blinkLabel: boolean = false
    blinkInterval: NodeJS.Timeout = null

    constructor(parent: BaseElement, panelCfg: PanelCfg, textInfoMessageConfig: TextInfoMessageCfg) {
        super(parent, panelCfg)
        this.relX = this.xOut = this.xIn = 42
        this.relY = this.yOut = this.yIn = 409
        this.imgAir = ResourceManager.getImage('Interface/Airmeter/msgpanel_air_juice.bmp')
        this.imgNoAir = ResourceManager.getImage('Interface/Airmeter/msgpanel_noair.bmp')

        this.registerEventListener(EventKey.LOCATION_CRYSTAL_FOUND, () => this.setMessage(textInfoMessageConfig.textCrystalFound))
        this.registerEventListener(EventKey.CAVERN_DISCOVERED, () => this.setMessage(textInfoMessageConfig.textCavernDiscovered))
        this.registerEventListener(EventKey.ORE_FOUND, () => this.setMessage(textInfoMessageConfig.textOreFound))
        this.registerEventListener(EventKey.AIR_LEVEL_CHANGED, (event: AirLevelChanged) => {
            this.onAirLevelChanged(event.airLevel, textInfoMessageConfig)
        })
        this.registerEventListener(EventKey.GAME_RESULT_STATE, (event: GameResultEvent) => {
            if (event.result === GameResultState.COMPLETE) this.setMessage(textInfoMessageConfig.textGameCompleted)
        })
        this.registerEventListener(EventKey.RAIDER_TRAINING_COMPLETE, (event: RaiderTrainingCompleteEvent) => event.training && this.setMessage(textInfoMessageConfig.textManTrained))
        this.registerEventListener(EventKey.VEHICLE_UPGRADE_COMPLETE, () => this.setMessage(textInfoMessageConfig.textUnitUpgraded))
        this.registerEventListener(EventKey.NERP_MESSAGE, (event: NerpMessageEvent) => {
            this.setTimedMessage({text: event.text}, event.messageTimeoutMs)
        })
        this.registerEventListener(EventKey.SET_SPACE_TO_CONTINUE, (event: SetSpaceToContinueEvent) => {
            if (event.state) {
                this.setTimedMessage(textInfoMessageConfig.textSpaceToContinue, 0)
            } else {
                this.unsetMessage(textInfoMessageConfig.textSpaceToContinue)
            }
        })
    }

    private onAirLevelChanged(airLevel: number, textInfoMessageConfig: TextInfoMessageCfg) {
        if (airLevel <= 0) return
        const nextAirLevelWidth = Math.round(this.maxAirLevelWidth * airLevel)
        if (this.airLevelWidth === nextAirLevelWidth) return
        const nextPercent = nextAirLevelWidth / this.maxAirLevelWidth
        if (nextPercent < this.nextAirWarning) {
            const critical = nextPercent <= AIR_LEVEL_LEVEL_LOW
            if (critical && !this.blinkInterval) this.blinkInterval = setInterval(() => {
                this.blinkLabel = !this.blinkLabel
                this.notifyRedraw()
            }, 1000)
            const infoMessageCfg = critical ? textInfoMessageConfig.textAirSupplyLow : textInfoMessageConfig.textAirSupplyRunningOut
            this.setMessage(infoMessageCfg)
        }
        this.nextAirWarning = Math.min(1 - AIR_LEVEL_WARNING_STEP, Math.floor(nextAirLevelWidth / this.maxAirLevelWidth / AIR_LEVEL_WARNING_STEP) * AIR_LEVEL_WARNING_STEP)
        this.airLevelWidth = nextAirLevelWidth
        this.notifyRedraw()
    }

    reset() {
        super.reset()
        this.airLevelWidth = this.maxAirLevelWidth
        this.nextAirWarning = 1 - AIR_LEVEL_WARNING_STEP
        this.blinkLabel = false
        this.blinkInterval = clearIntervalSafe(this.blinkInterval)
    }

    setMessage(cfg: TextInfoMessageEntryCfg) {
        if (this.currentMessage) return
        this.setTimedMessage(cfg, GameConfig.instance.main.textPauseTimeMs)
    }

    private setTimedMessage(cfg: TextInfoMessageEntryCfg, timeout: number) {
        const maxMessageWidth = this.img.width - 10 // XXX Read from cfg?
        this.textInfoMessageCache.getOrUpdate(cfg, () => TextInfoMessage.fromConfig(cfg, maxMessageWidth)).then((msg: TextInfoMessage) => {
            this.messageTimeout = clearTimeoutSafe(this.messageTimeout)
            this.currentMessage = msg
            this.notifyRedraw()
            if (this.currentMessage.sfxSample) this.publishEvent(new PlaySoundEvent(this.currentMessage.sfxSample, true))
            if (timeout > 0) {
                this.messageTimeout = setTimeout(() => {
                    this.messageTimeout = null
                    this.currentMessage = null
                    this.notifyRedraw()
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
        if (this.blinkLabel) context.drawImage(this.imgNoAir, this.x + 21, this.y)
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
