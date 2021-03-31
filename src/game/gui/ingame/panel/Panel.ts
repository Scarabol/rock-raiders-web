import { ResourceManager } from '../../../../resource/ResourceManager'
import { Button } from '../../base/button/Button'
import { BaseElement } from '../../base/BaseElement'
import { iGet } from '../../../../core/Util'
import { NATIVE_FRAMERATE, PANEL_ANIMATION_MULTIPLIER } from '../../../../main'
import { ButtonCfg } from '../../base/button/ButtonCfg'

export class Panel extends BaseElement {

    name: string
    img
    xIn: number = 0
    yIn: number = 0
    xOut: number = 0
    yOut: number = 0
    buttons = {}
    animationTimeout = null
    movedIn: boolean = false

    constructor(panelName: string = null, panelsCfg: {} = {}, buttonsCfg: {} = {}) {
        super()
        this.name = panelName
        if (panelsCfg && panelName) {
            let imgName;
            [imgName, this.xOut, this.yOut, this.xIn, this.yIn] = iGet(panelsCfg, panelName)
            this.img = ResourceManager.getImage(imgName)
            this.relX = this.xIn
            this.relY = this.yIn
        }
        if (buttonsCfg && panelName) {
            let panelButtonsCfg = iGet(buttonsCfg, panelName)
            if (panelButtonsCfg) {
                if (panelName === 'Panel_Encyclopedia') { // TODO refactor cfg handling
                    this.addButton(new Button(this, new ButtonCfg(panelButtonsCfg)))
                } else {
                    panelButtonsCfg.forEach((btnCfg) => this.addButton(new Button(this, new ButtonCfg(btnCfg))))
                }
            }
        }
    }

    addButton<T extends Button>(button: T): T {
        this.buttons[button.buttonType] = button
        this.addChild(button)
        return button
    }

    isInactive(): boolean {
        return this.animationTimeout || super.isInactive()
    }

    updateAnimation(targetX: number, targetY: number, speed: number, onDone: () => any) {
        const diffX = targetX - this.relX
        const diffY = targetY - this.relY
        if (Math.abs(diffX) <= speed && Math.abs(diffY) <= speed) {
            this.relX = targetX
            this.relY = targetY
            this.animationTimeout = null
            if (onDone) onDone()
        } else {
            this.relX += Math.round(Math.sign(diffX) * Math.sqrt(Math.abs(diffX)) * speed)
            this.relY += Math.round(Math.sign(diffY) * Math.sqrt(Math.abs(diffY)) * speed)
            const panel = this
            this.animationTimeout = setTimeout(() => panel.updateAnimation(targetX, targetY, speed, onDone), 1000 / NATIVE_FRAMERATE)
        }
        this.updatePosition()
        this.notifyRedraw()
    }

    setMovedIn(movedIn: boolean, onDone: () => any = null) {
        if (this.movedIn !== movedIn) {
            this.toggleState(onDone)
        } else if (onDone) {
            onDone()
        }
    }

    toggleState(onDone: () => any = null) {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout)
            this.animationTimeout = null
        }
        if (this.movedIn) {
            this.movedIn = false
            this.updateAnimation(this.xOut, this.yOut, PANEL_ANIMATION_MULTIPLIER, onDone)
        } else {
            this.movedIn = true
            this.updateAnimation(this.xIn, this.yIn, PANEL_ANIMATION_MULTIPLIER, onDone)
        }
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        if (this.img) context.drawImage(this.img, this.x, this.y)
        super.onRedraw(context)
    }

}

export class TopPanel extends Panel {

    btnPriorities: Button

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg)
        this.btnPriorities = iGet(this.buttons, 'PanelButton_TopPanel_Priorities')
    }

}

export class InfoDockPanel extends Panel {

    btnGoto: Button
    btnClose: Button

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg)
        this.btnGoto = iGet(this.buttons, 'PanelButton_InfoDock_Goto')
        this.btnGoto.disabled = true
        this.btnClose = iGet(this.buttons, 'PanelButton_InfoDock_Close')
        this.btnClose.disabled = true
    }

}
