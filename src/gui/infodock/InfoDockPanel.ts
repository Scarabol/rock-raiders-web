import { ButtonInfoDockCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { WorldLocationEvent } from '../../event/WorldLocationEvent'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { InfoDockButton } from './InfoDockButton'
import { InfoMessagesCfg } from './InfoMessagesCfg'
import { InformationPanel } from './InformationPanel'
import { CameraControl, PlaySoundEvent } from '../../event/GuiCommand'
import { InfoMessagesEntryConfig } from './InfoMessagesEntryConfig'
import { WorldLocationEventMap } from '../../event/EventTypeMap'
import { SaveGameManager } from '../../resource/SaveGameManager'

export class InfoDockPanel extends Panel {
    readonly stackButtons: InfoDockButton[] = []

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonInfoDockCfg, infoMessagesConfig: InfoMessagesCfg, readonly informationPanel: InformationPanel) {
        super(panelCfg)
        this.addChild(new Button(buttonsCfg.panelButtonInfoDockGoto)).onClick = () => this.gotoLatestMessage()
        this.addChild(new Button(buttonsCfg.panelButtonInfoDockClose)).onClick = () => this.dropLatestMessage()

        this.addInfoDockButton(infoMessagesConfig.infoGenericDeath, EventKey.LOCATION_DEATH)
        this.addInfoDockButton(infoMessagesConfig.infoGenericMonster, EventKey.LOCATION_MONSTER, EventKey.LOCATION_MONSTER_GONE)
        this.addInfoDockButton(infoMessagesConfig.infoCrystalFound, EventKey.LOCATION_CRYSTAL_FOUND)
        this.addInfoDockButton(infoMessagesConfig.infoUnderAttack, EventKey.LOCATION_UNDER_ATTACK)
        this.addInfoDockButton(infoMessagesConfig.infoLandslide, EventKey.LOCATION_LANDSLIDE)
        this.addInfoDockButton(infoMessagesConfig.infoPowerDrain, EventKey.LOCATION_POWER_DRAIN)
        this.addInfoDockButton(infoMessagesConfig.infoSlugEmerge, EventKey.LOCATION_SLUG_EMERGE, EventKey.LOCATION_SLUG_GONE)
        this.addInfoDockButton(infoMessagesConfig.infoFoundMiniFigure, EventKey.LOCATION_RAIDER_DISCOVERED)
    }

    reset() {
        super.reset()
        this.stackButtons.length = 0
    }

    private gotoLatestMessage() {
        if (this.stackButtons.length < 1) return
        const btn = this.stackButtons[0]
        if (btn.messages.length < 1) return
        const pos = btn.messages[0].location
        if (pos) this.publishEvent(new CameraControl({jumpToWorld: pos.getPosition2D()}))
    }

    private dropLatestMessage() {
        if (this.stackButtons.length < 1) return
        const button = this.stackButtons[0]
        if (button.messages.length < 1) return
        button.messages.shift()
        this.redrawAfterMessageStackUpdate(button)
    }

    private redrawAfterMessageStackUpdate(button: InfoDockButton) {
        if (button.messages.length < 1) {
            button.hidden = true
            this.informationPanel.setMovedIn(true)
            this.stackButtons.remove(button)
            this.slideStackIntoPosition().then()
        }
        button.notifyRedraw()
    }

    private addInfoDockButton(config: InfoMessagesEntryConfig, eventType: keyof WorldLocationEventMap, eventTypeGone?: keyof WorldLocationEventMap) {
        const infoDockButton = this.addChild(new InfoDockButton(this, config))
        this.registerEventListener(eventType, (event: WorldLocationEvent) => {
            if (infoDockButton.messages.some((m) => m.location === event.location)) return
            infoDockButton.hidden = false
            while (infoDockButton.messages.length >= 9) infoDockButton.messages.pop()
            infoDockButton.messages.unshift(event)
            this.showButton(infoDockButton)
            const sample = config.sfxName
            if (sample && !SaveGameManager.preferences.muteDevSounds) this.publishEvent(new PlaySoundEvent(sample, true))
        })
        if (eventTypeGone) {
            this.registerEventListener(eventTypeGone, (event: WorldLocationEvent) => {
                infoDockButton.messages.removeAll((e) => e.location === event.location)
                this.redrawAfterMessageStackUpdate(infoDockButton)
            })
        }
    }

    private showButton(button: InfoDockButton) {
        if (this.stackButtons.includes(button)) {
            button.notifyRedraw()
        } else {
            this.slideInButton(button)
        }
    }

    private slideInButton(button: InfoDockButton) {
        this.stackButtons.forEach(btn => btn.disabled = true)
        const targetY = -this.stackButtons.map(b => b.height).reduce((prev, cur) => prev + cur, 0)
        this.stackButtons.push(button)
        button.relX = -button.width
        button.relY = targetY - button.height
        button.updatePosition()
        button.slideToTarget(0, targetY).then(() => this.stackButtons.forEach(btn => btn.disabled = false))
    }

    buttonClicked(button: InfoDockButton) {
        if (button !== this.stackButtons[0]) {
            this.pushFirst(button)
        } else {
            this.informationPanel.setText(button.text)
            this.informationPanel.toggleState()
        }
    }

    private pushFirst(button: InfoDockButton) {
        this.stackButtons.splice(this.stackButtons.indexOf(button), 1)
        this.stackButtons.unshift(button)
        this.slideStackIntoPosition().then(() => {
            this.informationPanel.setText(button.text)
            this.informationPanel.setMovedIn(false)
        })
    }

    private slideStackIntoPosition() {
        this.stackButtons.forEach(btn => btn.disabled = true)
        let relY = 0
        const promises = this.stackButtons.map(btn => {
            const p = btn.slideToTarget(0, relY)
            relY -= btn.height
            return p
        })
        return new Promise<void>((resolve) => {
            Promise.all(promises).then(() => {
                this.stackButtons.forEach(btn => btn.disabled = false)
                resolve()
            })
        })
    }
}
