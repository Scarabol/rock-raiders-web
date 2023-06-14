import { Sample } from '../../audio/Sample'
import { SpriteContext } from '../../core/Sprite'
import { EventKey } from '../../event/EventKeyEnum'
import { MOUSE_BUTTON } from '../../event/EventTypeEnum'
import { GameEvent } from '../../event/GameEvent'
import { ChangeCursor, GuiCommand, PlaySoundEvent } from '../../event/GuiCommand'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from '../event/GuiEvent'
import { Cursor } from '../../resource/Cursor'

export class BaseElement {
    parent: BaseElement = null
    x: number = 0
    y: number = 0
    relX: number = 0
    relY: number = 0
    width: number = 0
    height: number = 0
    children: BaseElement[] = []
    hidden: boolean = false
    disabled: boolean = false
    hover: boolean = false
    pressedByButton: MOUSE_BUTTON = null
    onClick: (cx?: number, cy?: number) => any = null
    onClickSecondary: (cx?: number, cy?: number) => any = null
    onPublishEvent: (event: GuiCommand) => any = (event) => console.log(`TODO publish event: ${EventKey[event.eventKey]}`)

    constructor(parent: BaseElement) {
        this.parent = parent
    }

    reset() {
        this.hidden = false
        this.disabled = false
        this.hover = false
        this.pressedByButton = null
        this.children.forEach((c) => c.reset())
    }

    addChild<T extends BaseElement>(child: T): T {
        child.parent = this
        this.children.push(child)
        child.updatePosition()
        return child
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        this.children.forEach((child) => child.onRedraw(context))
        this.children.forEach((child) => child.drawHover(context))
    }

    drawHover(context: SpriteContext) {
    }

    isInactive(): boolean {
        for (let parent = this.parent; !!parent; parent = parent.parent) if (parent.isInactive()) return true
        return this.hidden || this.disabled
    }

    hide() {
        this.hidden = true
        this.children.forEach((child) => child.hide())
    }

    show() {
        this.hidden = false
        this.children.forEach((child) => child.show())
    }

    updatePosition() {
        this.x = this.parent ? this.parent.x + this.relX : this.relX
        this.y = this.parent ? this.parent.y + this.relY : this.relY
        this.children.forEach((child) => child.updatePosition())
    }

    isInRect(cx: number, cy: number) {
        return cx >= this.x && cy >= this.y && cx < this.x + this.width && cy < this.y + this.height
    }

    checkHover(event: GuiHoverEvent): void {
        const inRect = this.isInRect(event.sx, event.sy)
        if (inRect) this.onHoverInRect()
        if (!this.isInactive()) {
            event.hoverStateChanged = event.hoverStateChanged || this.hover !== inRect
            this.hover = inRect
            if (!this.hover) this.pressedByButton = null
        }
        this.children.forEach((child) => child.checkHover(event))
    }

    onHoverInRect(): void {
    }

    checkClick(event: GuiClickEvent): boolean {
        if (this.isInactive()) return false
        const oldState = this.pressedByButton
        if (this.isInRect(event.sx, event.sy)) {
            if (this.pressedByButton === null && ((event.button === MOUSE_BUTTON.MAIN && this.onClick) ||
                (event.button === MOUSE_BUTTON.SECONDARY && this.onClickSecondary))) {
                this.pressedByButton = event.button
            }
        } else {
            this.pressedByButton = null
        }
        let stateChanged = this.pressedByButton !== oldState
        this.children.forEach((child) => stateChanged = child.checkClick(event) || stateChanged)
        return stateChanged
    }

    checkRelease(event: GuiReleaseEvent): boolean {
        if (this.isInactive()) return false
        const inRect = this.isInRect(event.sx, event.sy)
        let stateChanged = false
        this.children.forEach((child) => stateChanged = child.checkRelease(event) || stateChanged)
        if (!stateChanged && inRect && this.pressedByButton !== null) {
            this.clicked(event)
        }
        stateChanged = this.pressedByButton !== null || stateChanged
        this.pressedByButton = null
        return stateChanged
    }

    clicked(event: GuiClickEvent) {
        if (event.button === MOUSE_BUTTON.MAIN) {
            if (this.onClick) {
                this.publishEvent(new ChangeCursor(Cursor.OKAY, 1000))
                this.publishEvent(new PlaySoundEvent(Sample.SFX_ButtonPressed))
                this.onClick(event.sx, event.sy)
            }
        } else if (event.button === MOUSE_BUTTON.SECONDARY) {
            if (this.onClickSecondary) {
                this.publishEvent(new ChangeCursor(Cursor.OKAY, 1000))
                this.publishEvent(new PlaySoundEvent(Sample.SFX_ButtonPressed))
                this.onClickSecondary(event.sx, event.sy)
            }
        }
    }

    release(): boolean {
        let stateChanged = this.pressedByButton !== null || this.hover
        this.pressedByButton = null
        this.hover = false
        this.children.forEach((child) => stateChanged = child.release() || stateChanged)
        return stateChanged
    }

    notifyRedraw() {
        this.parent?.notifyRedraw()
    }

    publishEvent(event: GuiCommand) {
        if (this.parent) this.parent.publishEvent(event)
        else this.onPublishEvent(event)
    }

    registerEventListener(eventKey: EventKey, callback: (event: GameEvent) => any) {
        this.parent.registerEventListener(eventKey, callback)
    }
}
