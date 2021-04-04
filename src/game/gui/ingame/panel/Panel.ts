import { ResourceManager } from '../../../../resource/ResourceManager'
import { BaseElement } from '../../base/BaseElement'
import { NATIVE_FRAMERATE, PANEL_ANIMATION_MULTIPLIER } from '../../../../main'
import { PanelCfg } from '../../../../cfg/PanelsCfg'

export class Panel extends BaseElement {

    img: HTMLCanvasElement = null
    xOut: number = 0
    yOut: number = 0
    xIn: number = 0
    yIn: number = 0
    animationTimeout = null
    movedIn: boolean = true // xIn, yIn is the collapsed position out of screen

    constructor(panelCfg?: PanelCfg) {
        super()
        if (panelCfg) {
            this.img = ResourceManager.getImage(panelCfg.filename)
            this.xOut = panelCfg.xOut
            this.yOut = panelCfg.yOut
            this.xIn = panelCfg.xIn
            this.yIn = panelCfg.yIn
            this.relX = this.xIn
            this.relY = this.yIn
        }
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

