import { clearIntervalSafe } from '../core/Util'
import { NATIVE_FRAMERATE } from '../params'

export class AnimatedCursor {
    animationInterval: NodeJS.Timeout = null
    animationIndex: number = 0

    constructor(readonly cursorUrls: string[]) {
    }

    enableAnimation(targetElement: HTMLElement) {
        this.animationIndex = 0
        if (this.cursorUrls.length > 1) {
            this.animationInterval = clearIntervalSafe(this.animationInterval)
            this.animationInterval = setInterval(() => {
                this.animationIndex = (this.animationIndex + 1) % this.cursorUrls.length
                targetElement.style.cursor = this.cursorUrls[this.animationIndex]
            }, 1000 / NATIVE_FRAMERATE)
        } else {
            targetElement.style.cursor = this.cursorUrls[this.animationIndex]
        }
    }

    disableAnimation() {
        this.animationInterval = clearIntervalSafe(this.animationInterval)
    }
}
