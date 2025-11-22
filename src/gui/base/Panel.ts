import { PanelCfg } from '../../cfg/PanelCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { clearTimeoutSafe } from '../../core/Util'
import { NATIVE_UPDATE_INTERVAL, PANEL_ANIMATION_MULTIPLIER } from '../../params'
import { BaseElement } from './BaseElement'
import { ResourceManager } from '../../resource/ResourceManager'

export class Panel extends BaseElement {
    img: SpriteImage | undefined
    xOut: number = 0
    yOut: number = 0
    xIn: number = 0
    yIn: number = 0
    animationTimeout: NodeJS.Timeout | undefined
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
            this.width = this.img.width
            this.height = this.img.height
        }
    }

    override reset() {
        super.reset()
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        this.relX = this.xIn
        this.relY = this.yIn
        this.movedIn = true
        this.updatePosition()
    }

    override isInactive(): boolean {
        return !!this.animationTimeout || super.isInactive()
    }

    setMovedIn(movedIn: boolean, onDone?: () => void) {
        if (this.movedIn !== movedIn) {
            this.toggleState(onDone)
        } else if (onDone) {
            onDone()
        }
    }

    toggleState(onDone?: () => void) {
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        if (this.movedIn) {
            this.movedIn = false
            this.updateAnimation(this.xOut, this.yOut, PANEL_ANIMATION_MULTIPLIER, onDone)
        } else {
            this.movedIn = true
            this.updateAnimation(this.xIn, this.yIn, PANEL_ANIMATION_MULTIPLIER, onDone)
        }
    }

    protected updateAnimation(targetX: number, targetY: number, speed: number, onDone: (() => void) | undefined) {
        const diffX = targetX - this.relX
        const diffY = targetY - this.relY
        if (Math.abs(diffX) <= Math.sqrt(Math.abs(diffX)) * speed && Math.abs(diffY) <= Math.sqrt(Math.abs(diffY)) * speed) {
            this.relX = targetX
            this.relY = targetY
            this.animationTimeout = undefined
            if (onDone) onDone()
        } else {
            this.relX += Math.round(Math.sign(diffX) * Math.sqrt(Math.abs(diffX)) * speed)
            this.relY += Math.round(Math.sign(diffY) * Math.sqrt(Math.abs(diffY)) * speed)
            this.animationTimeout = setTimeout(() => {
                this.updateAnimation(targetX, targetY, speed, onDone)
            }, NATIVE_UPDATE_INTERVAL)
        }
        this.updatePosition()
        this.notifyRedraw()
    }

    override onRedraw(context: SpriteContext) {
        if (this.hidden) return
        if (this.img) context.drawImage(this.img, this.x, this.y)
        super.onRedraw(context)
    }
}
