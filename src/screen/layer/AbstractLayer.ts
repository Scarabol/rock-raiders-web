import { ScreenMaster } from '../ScreenMaster'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { SpriteImage } from '../../core/Sprite'

export abstract class AbstractLayer {
    readonly eventListener: Set<string> = new Set()
    private readonly listenerDisposers: (() => void)[] = []
    screenMaster: ScreenMaster | undefined
    zIndex: number = 0
    active: boolean = false
    ratio: number = NATIVE_SCREEN_WIDTH / NATIVE_SCREEN_HEIGHT

    abstract get element(): HTMLElement

    addEventListener<K extends keyof HTMLElementEventMap>(eventType: K, listener: (event: HTMLElementEventMap[K]) => boolean) {
        this.eventListener.add(eventType)
        const handler = (event: Event) => {
            event.stopPropagation()
            if (!this.screenMaster) return
            const consumed = this.active && listener(event as HTMLElementEventMap[K])
            if (!consumed) this.screenMaster.dispatchEvent(event, this.zIndex)
            if (eventType === 'mousemove') this.screenMaster.onGlobalMouseMoveEvent(event as PointerEvent)
            else if (eventType === 'mouseleave') this.screenMaster.onGlobalMouseLeaveEvent(event as PointerEvent)
        }
        this.element.addEventListener(eventType, handler)
        this.listenerDisposers.push(() => this.element.removeEventListener(eventType, handler))
    }

    dispose() {
        for (const disposeListener of this.listenerDisposers.splice(0)) disposeListener()
        this.eventListener.clear()
    }

    reset() {
    }

    setZIndex(zIndex: number) {
        this.zIndex = zIndex
        this.element.style.zIndex = String(zIndex)
        this.element.tabIndex = -1 // allow programmatic focus without disrupting normal tab order
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
