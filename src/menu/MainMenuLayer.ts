import { MenuEntryCfg, MenuEntryOverlayCfg } from '../cfg/MenuEntryCfg'
import { SpriteImage } from '../core/Sprite'
import { clearIntervalSafe, clearTimeoutSafe } from '../core/Util'
import { MOUSE_BUTTON, POINTER_EVENT } from '../event/EventTypeEnum'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { ScaledLayer } from '../screen/layer/ScreenLayer'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuIconButton } from './MainMenuIconButton'
import { MainMenuLabelButton } from './MainMenuLabelButton'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { imgDataToCanvas } from '../core/ImageHelper'
import { SoundManager } from '../audio/SoundManager'

export class MainMenuLayer extends ScaledLayer {
    static readonly SCROLL_AREA_HEIGHT = 180

    cfg: MenuEntryCfg
    menuImage: SpriteImage
    items: MainMenuBaseItem[] = []
    scrollY: number = 0
    scrollSpeedY: number = 0
    scrollInterval: NodeJS.Timeout = null
    overlayFrame: { img: SpriteImage, x: number, y: number } = null
    overlayImages: SpriteImage[] = []
    overlayTimeout: NodeJS.Timeout = null
    overlayIndex: number = 0

    constructor(menuCfg: MenuEntryCfg) {
        super()
        this.cfg = menuCfg
        this.menuImage = menuCfg.menuImage ? ResourceManager.getImage(menuCfg.menuImage) : null // TODO create all the images in loading phase
        let titleImage: SpriteImage = null
        if (menuCfg.displayTitle && menuCfg.fullName) {
            ResourceManager.bitmapFontWorkerPool.createTextImage(menuCfg.loFont, menuCfg.fullName) // TODO create all the images in loading phase
                .then((img) => titleImage = img)
        }
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.fixedWidth, this.fixedHeight)
            if (this.menuImage) context.drawImage(this.menuImage, 0, -this.scrollY)
            if (this.overlayFrame?.img) context.drawImage(this.overlayFrame.img, this.overlayFrame.x, this.overlayFrame.y)
            if (titleImage) context.drawImage(titleImage, (this.fixedWidth - titleImage.width) / 2, this.cfg.position[1])
            this.items.forEach((item, index) => (this.items[this.items.length - 1 - index]).draw(context))
        }

        menuCfg.itemsLabel.forEach((item) => {
            if (item.label) {
                this.items.push(new MainMenuLabelButton(this, item))
            } else {
                this.items.push(new MainMenuIconButton(this, item))
            }
        })

        new Map<keyof HTMLElementEventMap, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            this.addEventListener(eventType, (event): boolean => {
                const gameEvent = new GamePointerEvent(eventEnum, event as PointerEvent)
                ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
                return this.handlePointerEvent(gameEvent)
            })
        })
        this.addEventListener('wheel', (event: WheelEvent): boolean => {
            if (!this.cfg.canScroll) return false
            const gameEvent = new GameWheelEvent(event)
            ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
            this.setScrollY(gameEvent.deltaY)
            this.updateItemsHoveredState(gameEvent.canvasX, gameEvent.canvasY)
            return true
        })
    }

    reset() {
        super.reset()
        this.items.forEach((item) => item.reset())
        this.scrollY = 0
        this.scrollSpeedY = 0
        this.scrollInterval = clearIntervalSafe(this.scrollInterval)
        this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
        this.overlayFrame = null
        // TODO stop playing overlay sfx sound
    }

    show() {
        this.items.sort((a, b) => b.zIndex - a.zIndex)
        super.show()
        if (this.cfg.playRandom) {
            this.cfg.overlays.shuffle()
            this.playRandomOverlay()
        }
    }

    hide() {
        this.items.forEach((item) => item.reset())
        this.scrollSpeedY = 0
        this.scrollInterval = clearIntervalSafe(this.scrollInterval)
        this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
        this.overlayFrame = null
        // TODO stop playing overlay sfx sound
        super.hide()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            this.updateItemsHoveredState(event.canvasX, event.canvasY)
            if (this.cfg.canScroll) {
                if (event.canvasY < MainMenuLayer.SCROLL_AREA_HEIGHT) {
                    this.setScrollSpeedY(-(MainMenuLayer.SCROLL_AREA_HEIGHT - event.canvasY))
                } else if (event.canvasY > this.fixedHeight - MainMenuLayer.SCROLL_AREA_HEIGHT) {
                    this.setScrollSpeedY(event.canvasY - (this.fixedHeight - MainMenuLayer.SCROLL_AREA_HEIGHT))
                } else {
                    this.setScrollSpeedY(0)
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.DOWN) {
            this.updateItemsHoveredState(event.canvasX, event.canvasY)
            if (event.button === MOUSE_BUTTON.MAIN) {
                let needsRedraw = false
                this.items.forEach((item) => needsRedraw = item.onMouseDown() || needsRedraw)
                if (needsRedraw) {
                    this.animationFrame.notifyRedraw()
                    return true
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            this.updateItemsHoveredState(event.canvasX, event.canvasY)
            if (event.button === MOUSE_BUTTON.MAIN) {
                let needsRedraw = false
                this.items.forEach((item) => needsRedraw = item.onMouseUp() || needsRedraw)
                if (needsRedraw) {
                    this.animationFrame.notifyRedraw()
                    return true
                }
            }
        }
        if (this.needsRedraw()) this.animationFrame.notifyRedraw()
        return false
    }

    private setScrollSpeedY(deltaY: number) {
        const nextScrollSpeedY = Math.sign(deltaY) * Math.pow(Math.round(Math.min(100, deltaY) / 20), 2)
        if (nextScrollSpeedY === this.scrollSpeedY) return
        this.scrollSpeedY = nextScrollSpeedY
        if (!this.scrollSpeedY) {
            this.scrollInterval = clearIntervalSafe(this.scrollInterval)
        } else if (!this.scrollInterval) {
            this.scrollInterval = setInterval(() => {
                this.setScrollY(this.scrollSpeedY)
            }, NATIVE_UPDATE_INTERVAL)
        }
    }

    private updateItemsHoveredState(sx: number, sy: number) {
        let needsRedraw = false
        let hasHovered = false
        this.items.forEach((item) => {
            if (!hasHovered) {
                const absY = sy + (item.scrollAffected ? this.scrollY : 0)
                hasHovered = item.isHovered(sx, absY)
                item.setHovered(hasHovered)
            } else {
                item.setHovered(false)
            }
            needsRedraw = needsRedraw || item.needsRedraw
        })
        if (needsRedraw) this.animationFrame.notifyRedraw()
    }

    private setScrollY(deltaY: number) {
        const scrollYBefore = this.scrollY
        this.scrollY = Math.min(Math.max(this.scrollY + deltaY, 0), this.menuImage.height - this.fixedHeight)
        if (scrollYBefore !== this.scrollY) this.animationFrame.notifyRedraw()
    }

    needsRedraw(): boolean {
        return this.items.some((item) => item.needsRedraw)
    }

    set onItemAction(callback: (item: MainMenuBaseItem) => any) {
        this.items.forEach((item) => item.onPressed = () => callback(item))
    }

    playRandomOverlay(): void {
        this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
        this.overlayTimeout = setTimeout(async () => {
            const overlay = this.cfg.overlays[this.overlayIndex]
            this.overlayIndex = (this.overlayIndex + 1) % this.cfg.overlays.length
            await this.playOverlay(overlay)
            this.playRandomOverlay()
        }, Math.randomInclusive(2000, 5000))
    }

    async playOverlay(overlay: MenuEntryOverlayCfg) {
        if (!overlay) return
        if (overlay.sfxName) SoundManager.playSound(overlay.sfxName, false)
        this.overlayImages = ResourceManager.getResource(overlay.flhFilepath).map((f: ImageData) => imgDataToCanvas(f))
        this.overlayFrame = {img: this.overlayImages[0], x: overlay.x, y: overlay.y}
        await this.renderNextOverlayFrame(0)
    }

    renderNextOverlayFrame(frameIndex: number): Promise<void> {
        return new Promise<void>((resolve) => {
            this.overlayFrame.img = this.overlayImages[frameIndex]
            this.animationFrame.notifyRedraw()
            if (frameIndex + 1 < this.overlayImages.length) {
                this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
                this.overlayTimeout = setTimeout(() => {
                    this.renderNextOverlayFrame(frameIndex + 1).then(() => resolve())
                }, NATIVE_UPDATE_INTERVAL)
            } else {
                resolve()
            }
        })
    }
}
