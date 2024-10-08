import { clearIntervalSafe } from '../core/Util'
import { NATIVE_UPDATE_INTERVAL } from '../params'

export class AnimatedCursorData { // This gets serialized for caching
    readonly dataUrls: string[] = []

    constructor(cursorImages: HTMLCanvasElement[]) {
        this.dataUrls = cursorImages.map((c) => `url(${c.toDataURL()}), auto`)
    }
}

export class AnimatedCursor {
    animationInterval?: NodeJS.Timeout
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
            }, NATIVE_UPDATE_INTERVAL)
        } else {
            targetElement.style.cursor = this.cursorUrls[this.animationIndex]
        }
    }

    disableAnimation() {
        this.animationInterval = clearIntervalSafe(this.animationInterval)
    }
}
