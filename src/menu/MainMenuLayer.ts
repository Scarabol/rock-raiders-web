import { ScaledLayer } from '../screen/layer/ScaledLayer'
import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { SpriteImage } from '../core/Sprite'
import { clearIntervalSafe, clearTimeoutSafe } from '../core/Util'
import { MOUSE_BUTTON, POINTER_EVENT, PointerEventType } from '../event/EventTypeEnum'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuIconButton } from './MainMenuIconButton'
import { MainMenuLabelButton } from './MainMenuLabelButton'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { FlicAnimOverlay } from './FlicAnimOverlay'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { PRNG } from '../game/factory/PRNG'

export class MainMenuLayer extends ScaledLayer {
    static readonly SCROLL_AREA_HEIGHT = 180

    readonly cfg: MenuEntryCfg
    readonly menuImage: SpriteImage | undefined
    readonly items: MainMenuBaseItem[] = []
    readonly overlays: FlicAnimOverlay[] = []
    scrollY: number = 0
    scrollSpeedY: number = 0
    scrollInterval: NodeJS.Timeout | undefined
    overlayTimeout: NodeJS.Timeout | undefined
    overlayIndex: number = 0
    overlay: FlicAnimOverlay | undefined
    lastScrollY: number = 0
    hasScrolled: boolean = false

    constructor(menuCfg: MenuEntryCfg) {
        super()
        this.cfg = menuCfg
        this.menuImage = menuCfg.menuImage ? ResourceManager.getImage(menuCfg.menuImage) : undefined // TODO create all images in loading phase
        let titleImage: SpriteImage | undefined
        if (menuCfg.displayTitle && menuCfg.fullName) {
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.loFont, menuCfg.fullName) // TODO create all images in loading phase
                .then((img) => titleImage = img)
        }
        menuCfg.itemsLabel.forEach((item) => {
            if (item.label) {
                this.items.push(new MainMenuLabelButton(this, item))
            } else {
                this.items.push(new MainMenuIconButton(this, item))
            }
        })
        this.cfg.overlays.forEach((flic) => {
            const flicImages = ResourceManager.getResource(flic.flhFilepath) ?? []
            this.overlays.push(new FlicAnimOverlay(this.animationFrame, flicImages, flic.x, flic.y, flic.sfxName))
        })
        if (this.cfg.playRandom) PRNG.unsafe.shuffle(this.cfg.overlays)
        this.animationFrame.onRedraw = (context) => {
            if (this.menuImage) context.drawImage(this.menuImage, 0, -this.scrollY)
            this.overlay?.draw(context)
            if (titleImage) context.drawImage(titleImage, (this.fixedWidth - titleImage.width) / 2, this.cfg.position.y)
            this.items.forEach((_item, index) => (this.items[this.items.length - 1 - index]).draw(context))
        }
        new Map<keyof HTMLElementEventMap, PointerEventType>([
            ['pointermove', POINTER_EVENT.move],
            ['pointerdown', POINTER_EVENT.down],
            ['pointerup', POINTER_EVENT.up],
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
            this.updateItemsHoveredState(gameEvent.canvasX, gameEvent.canvasY, false)
            return true
        })
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.overlay?.stop()
                this.overlay = undefined
                this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
                this.animationFrame.notifyRedraw()
            } else if (this.cfg.playRandom && this.active) {
                this.playRandomOverlay()
            }
        })
    }

    override reset() {
        super.reset()
        this.items.forEach((item) => item.reset())
        this.scrollY = 0
        this.scrollSpeedY = 0
        this.scrollInterval = clearIntervalSafe(this.scrollInterval)
        this.overlay?.stop()
        this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
    }

    override show() {
        this.items.sort((a, b) => b.zIndex - a.zIndex)
        super.show()
        if (this.cfg.playRandom) this.playRandomOverlay()
    }

    override hide() {
        this.items.forEach((item) => item.reset())
        this.scrollSpeedY = 0
        this.scrollInterval = clearIntervalSafe(this.scrollInterval)
        this.overlay?.stop()
        this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
        super.hide()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (event.eventEnum === POINTER_EVENT.move) {
            this.updateItemsHoveredState(event.canvasX, event.canvasY, false)
            if (this.cfg.canScroll) {
                if (event.pointerType === 'mouse') {
                    if (event.canvasY < MainMenuLayer.SCROLL_AREA_HEIGHT) {
                        this.setScrollSpeedY(-(MainMenuLayer.SCROLL_AREA_HEIGHT - event.canvasY))
                    } else if (event.canvasY > this.fixedHeight - MainMenuLayer.SCROLL_AREA_HEIGHT) {
                        this.setScrollSpeedY(event.canvasY - (this.fixedHeight - MainMenuLayer.SCROLL_AREA_HEIGHT))
                    } else {
                        this.setScrollSpeedY(0)
                    }
                } else {
                    const sy = event.canvasY
                    if (this.lastScrollY) {
                        this.setScrollY(this.lastScrollY - sy)
                        this.hasScrolled = true
                    }
                    this.lastScrollY = sy
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.down) {
            this.updateItemsHoveredState(event.canvasX, event.canvasY, false)
            if (event.button === MOUSE_BUTTON.main) {
                let needsRedraw = false
                this.items.forEach((item) => needsRedraw = item.onMouseDown() || needsRedraw)
                if (needsRedraw) {
                    this.animationFrame.notifyRedraw()
                    return true
                }
            }
            this.lastScrollY = event.canvasY
        } else if (event.eventEnum === POINTER_EVENT.up) {
            this.updateItemsHoveredState(event.canvasX, event.canvasY, this.hasScrolled)
            if (event.button === MOUSE_BUTTON.main && !this.hasScrolled) {
                let needsRedraw = false
                this.items.forEach((item) => needsRedraw = item.onMouseUp() || needsRedraw)
                if (needsRedraw) {
                    this.animationFrame.notifyRedraw()
                    return true
                }
            }
            this.lastScrollY = 0
            this.hasScrolled = false
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

    private updateItemsHoveredState(sx: number, sy: number, forceRelease: boolean) {
        let needsRedraw = false
        let hasHovered = forceRelease
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
        this.scrollY = Math.min(Math.max(this.scrollY + deltaY, 0), (this.menuImage?.height ?? this.fixedHeight) - this.fixedHeight)
        if (scrollYBefore !== this.scrollY) this.animationFrame.notifyRedraw()
    }

    needsRedraw(): boolean {
        return this.items.some((item) => item.needsRedraw)
    }

    set onItemAction(callback: (item: MainMenuBaseItem) => void) {
        this.items.forEach((item) => item.onPressed = () => callback(item))
    }

    playRandomOverlay(): void {
        this.overlay?.stop()
        this.overlayTimeout = clearTimeoutSafe(this.overlayTimeout)
        if (this.overlays.length < 1) return
        this.overlayTimeout = setTimeout(async () => {
            this.overlay = this.overlays[this.overlayIndex]
            this.overlayIndex = (this.overlayIndex + 1) % this.cfg.overlays.length
            await this.overlay.play()
            this.playRandomOverlay()
        }, 2000 + PRNG.unsafe.randInt(3000))
    }
}
