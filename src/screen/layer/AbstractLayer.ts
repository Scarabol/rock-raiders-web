import { ScreenMaster } from '../ScreenMaster'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { SpriteImage } from '../../core/Sprite'

export abstract class AbstractLayer {
    readonly eventListener: Set<string> = new Set()
    screenMaster: ScreenMaster | undefined
    zIndex: number = 0
    active: boolean = false
    ratio: number = NATIVE_SCREEN_WIDTH / NATIVE_SCREEN_HEIGHT

    abstract get element(): HTMLElement

    addEventListener<K extends keyof HTMLElementEventMap>(eventType: K, listener: (event: HTMLElementEventMap[K]) => boolean) {
        this.eventListener.add(eventType)
        this.element.addEventListener(eventType, (event) => {
            event.stopPropagation()
            if (!this.screenMaster) return
            const consumed = this.active && listener(event)
            if (!consumed) this.screenMaster.dispatchEvent(event, this.zIndex)
            if (eventType === 'mousemove') this.screenMaster.onGlobalMouseMoveEvent(event as PointerEvent)
            else if (eventType === 'mouseleave') this.screenMaster.onGlobalMouseLeaveEvent(event as PointerEvent)
        })
    }

    reset() {
    }

    setZIndex(zIndex: number) {
        this.zIndex = zIndex
        this.element.style.zIndex = String(zIndex)
        this.element.tabIndex = zIndex // enable keyboard input for canvas element
    }

    abstract resize(width: number, height: number): void

    show() {
        this.active = true
        this.element.style.visibility = 'visible'
    }

    hide() {
        this.active = false
        this.element.style.visibility = 'hidden'
    }

    abstract takeScreenshotFromLayer(): Promise<SpriteImage | undefined>
}
