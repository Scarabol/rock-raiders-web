import { InfoButtonCfg } from '../../cfg/ButtonCfg'
import { SpriteContext } from '../../core/Sprite'
import { clearTimeoutSafe } from '../../core/Util'
import { WorldLocationEvent } from '../../event/WorldLocationEvent'
import { NATIVE_UPDATE_INTERVAL } from '../../params'
import { Button } from '../base/Button'
import { InfoDockPanel } from './InfoDockPanel'
import { InfoMessagesEntryConfig } from './InfoMessagesEntryConfig'

export class InfoDockButton extends Button {
    messages: WorldLocationEvent[] = [] // newest message first
    text: string
    animationTimeout?: NodeJS.Timeout
    animationSpeedX = 0.5
    animationSpeedY = 1

    constructor(parent: InfoDockPanel, infoMessagesEntryConfig: InfoMessagesEntryConfig) {
        super(new InfoButtonCfg(infoMessagesEntryConfig.buttonImageFilename))
        this.text = infoMessagesEntryConfig.message
        this.hidden = true

        this.onClick = () => {
            if (this.messages.length < 1) return
            parent.buttonClicked(this)
        }
    }

    reset() {
        super.reset()
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        this.hidden = true
        this.messages = []
    }

    slideToTarget(targetX: number, targetY: number): Promise<void> {
        return new Promise<void>((resolve) => this.updateAnimation(targetX, targetY, resolve))
    }

    private updateAnimation(targetX: number, targetY: number, onDone: () => any) { // TODO refactor: almost equal with code for Panel
        const diffX = targetX - this.relX
        const diffY = targetY - this.relY
        if (Math.abs(diffX) <= this.animationSpeedX && Math.abs(diffY) <= this.animationSpeedY) {
            this.relX = targetX
            this.relY = targetY
            this.animationTimeout = null
            if (onDone) onDone()
        } else {
            this.relX += Math.round(Math.sign(diffX) * Math.sqrt(Math.abs(diffX)) * this.animationSpeedX)
            this.relY += Math.round(Math.sign(diffY) * Math.sqrt(Math.abs(diffY)) * this.animationSpeedY)
            const that = this
            this.animationTimeout = setTimeout(() => that.updateAnimation(targetX, targetY, onDone), NATIVE_UPDATE_INTERVAL)
        }
        this.updatePosition()
        this.notifyRedraw()
    }

    onRedraw(context: SpriteContext) {
        super.onRedraw(context)
        if (this.hidden) return
        context.textAlign = 'left'
        context.font = 'bold 10px Arial'
        context.fillStyle = '#fff'
        context.fillText(this.messages.length.toString(), this.x + 2, this.y + this.height / 2 + 2)
    }
}
