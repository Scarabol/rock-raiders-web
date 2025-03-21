import { SpriteContext } from '../../core/Sprite'
import { PlaySoundEvent } from '../../event/GuiCommand'
import { CursorManager } from '../../screen/CursorManager'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../event/GuiEvent'
import { CURSOR } from '../../resource/Cursor'
import { BaseEvent, EventTypeMap } from '../../event/EventTypeMap'
import { EventBroker } from '../../event/EventBroker'

export class BaseElement {
    parent?: BaseElement
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
    pressed: boolean = false
    pointerDown?: { x: number, y: number }
    onClick?: (cx: number, cy: number) => void

    reset() {
        this.hidden = false
        this.disabled = false
        this.hover = false
        this.pressed = false
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

    isInRect(sx: number, sy: number) {
        return sx >= this.x && sy >= this.y && sx < this.x + this.width && sy < this.y + this.height
    }

    onPointerMove(event: GuiHoverEvent): void {
        const inRect = this.isInRect(event.sx, event.sy)
        if (inRect && !this.hover) this.onHoverStart()
        else if (!inRect && this.hover) this.onHoverEnd()
        if (!this.isInactive()) {
            event.hoverStateChanged = event.hoverStateChanged || this.hover !== inRect
            this.hover = inRect
            if (!this.hover) this.pressed = false
        }
        this.children.forEach((child) => child.onPointerMove(event))
        if (this.hover && this.pointerDown && (Math.abs(event.sx - this.pointerDown.x) > 5 || Math.abs(event.sy - this.pointerDown.y) > 5)) {
            this.onDrag(event.sx, event.sy)
        } else {
            this.pointerDown = undefined
        }
    }

    onHoverStart(): void {
    }

    onHoverEnd(): void {
    }

    onDrag(x: number, y: number): void {
    }

    onPointerDown(event: GuiPointerDownEvent): boolean {
        this.pointerDown = undefined
        if (this.isInactive()) return false
        this.pointerDown = {x: event.sy, y: event.sy}
        const oldState = this.pressed
        if (this.isInRect(event.sx, event.sy)) {
            if (!this.pressed && this.onClick) {
                this.pressed = true
            }
        } else {
            this.pressed = false
        }
        let stateChanged = this.pressed !== oldState
        this.children.forEach((child) => stateChanged = child.onPointerDown(event) || stateChanged)
        return stateChanged
    }

    onPointerUp(event: GuiPointerUpEvent): boolean {
        this.pointerDown = undefined
        if (this.isInactive()) return false
        const inRect = this.isInRect(event.sx, event.sy)
        let stateChanged = false
        this.children.forEach((child) => stateChanged = child.onPointerUp(event) || stateChanged)
        if (!stateChanged && inRect && this.pressed) {
            this.clicked(event)
        }
        stateChanged = this.pressed || stateChanged
        this.pressed = false
        return stateChanged
    }

    clicked(event: GuiPointerDownEvent) {
        if (this.onClick) {
            CursorManager.changeCursor(CURSOR.OKAY, 1000)
            this.publishEvent(new PlaySoundEvent('SFX_ButtonPressed', false))
            this.onClick(event.sx, event.sy)
        }
    }

    onPointerLeave(): boolean {
        let stateChanged = this.pressed || this.hover
        this.pressed = false
        this.hover = false
        this.children.forEach((child) => stateChanged = child.onPointerLeave() || stateChanged)
        return stateChanged
    }

    notifyRedraw() {
        this.parent?.notifyRedraw()
    }

    publishEvent(event: BaseEvent) {
        // TODO This should not be inlined, but replaced with some GUI specific event bus or merged with GuiManager
        EventBroker.publish(event)
    }

    registerEventListener<Type extends keyof EventTypeMap>(eventType: Type, callback: (event: EventTypeMap[Type]) => void) {
        // TODO This should not be inlined, but replaced with some GUI specific event bus or merged with GuiManager
        EventBroker.subscribe(eventType, callback)
    }
}
