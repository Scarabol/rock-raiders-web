import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { SpriteImage } from '../core/Sprite'
import { clearIntervalSafe } from '../core/Util'
import { MOUSE_BUTTON, POINTER_EVENT } from '../event/EventTypeEnum'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { ScaledLayer } from '../screen/layer/ScreenLayer'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuIconButton } from './MainMenuIconButton'
import { MainMenuLabelButton } from './MainMenuLabelButton'

export class MainMenuLayer extends ScaledLayer {
    cfg: MenuEntryCfg
    menuImage: SpriteImage
    items: MainMenuBaseItem[] = []
    scrollY: number = 0
    scrollSpeedY: number = 0
    scrollInterval: NodeJS.Timeout = null

    constructor(menuCfg: MenuEntryCfg) {
        super()
        this.cfg = menuCfg
        this.menuImage = menuCfg.menuImage ? ResourceManager.getImage(menuCfg.menuImage) : null
        ResourceManager.bitmapFontWorkerPool.createTextImage(menuCfg.loFont, menuCfg.fullName)
            .then((titleImage) => {
                this.animationFrame.onRedraw = (context) => {
                    context.drawImage(this.menuImage, 0, -this.scrollY)
                    if (menuCfg.displayTitle) context.drawImage(titleImage, (this.fixedWidth - titleImage.width) / 2, this.cfg.position[1])
                    this.items.forEach((item, index) => (this.items[this.items.length - 1 - index]).draw(context))
                }
            })

        menuCfg.itemsLabel.forEach((item) => {
            if (item.label) {
                this.items.push(new MainMenuLabelButton(this, item))
            } else {
                this.items.push(new MainMenuIconButton(this, item))
            }
        })

        this.items.sort((a, b) => MainMenuBaseItem.compareZ(a, b))
        new Map<keyof HTMLElementEventMap, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
            ['pointerleave', POINTER_EVENT.LEAVE],
        ]).forEach((eventEnum, eventType) => {
            this.addEventListener(eventType, (event: PointerEvent): boolean => {
                const gameEvent = new GamePointerEvent(eventEnum, event)
                ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(event.clientX, event.clientY)
                return this.handlePointerEvent(gameEvent)
            })
        })
        this.addEventListener('wheel', (event: WheelEvent): boolean => {
            if (!this.cfg.canScroll) return false
            this.setScrollY(event.deltaY)
            const [canvasX, canvasY] = this.transformCoords(event.clientX, event.clientY)
            this.updateItemsHoveredState(canvasX, canvasY)
            return true
        })
    }

    reset() {
        super.reset()
        this.items.forEach((item) => item.reset())
        this.scrollY = 0
        this.scrollSpeedY = 0
        this.scrollInterval = clearIntervalSafe(this.scrollInterval)
    }

    hide() {
        this.items.forEach((item) => item.reset())
        this.scrollSpeedY = 0
        this.scrollInterval = clearIntervalSafe(this.scrollInterval)
        super.hide()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            this.updateItemsHoveredState(event.canvasX, event.canvasY)
            if (this.cfg.canScroll) {
                const scrollAreaHeight = 100
                if (event.canvasY < scrollAreaHeight) {
                    this.setScrollSpeedY(-(scrollAreaHeight - event.canvasY))
                } else if (event.canvasY > this.fixedHeight - scrollAreaHeight) {
                    this.setScrollSpeedY(event.canvasY - (this.fixedHeight - scrollAreaHeight))
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
                if (this.screenMaster.doubleTapToFullscreen()) return true
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
        } else if (event.eventEnum === POINTER_EVENT.LEAVE) {
            this.scrollSpeedY = 0
            this.scrollInterval = clearIntervalSafe(this.scrollInterval)
            return true
        }
        if (this.needsRedraw()) this.animationFrame.notifyRedraw()
        return false
    }

    private setScrollSpeedY(deltaY: number) {
        const nextScrollSpeedY = Math.sign(deltaY) * Math.pow(Math.round(deltaY / 20), 2)
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
}
