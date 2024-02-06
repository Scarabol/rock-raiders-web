import { ButtonCfg } from '../../cfg/ButtonCfg'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../event/GuiEvent'
import { BaseElement } from './BaseElement'
import { Button } from './Button'

export class ToggleButton extends Button {
    toggleState: boolean = false

    constructor(parent: BaseElement, btnCfg: ButtonCfg) {
        super(parent, btnCfg)
    }

    reset() {
        super.reset()
        this.toggleState = false
    }

    onPointerMove(event: GuiHoverEvent): void {
        const inRect = this.isInRect(event.sx, event.sy)
        if (inRect && !this.hover) this.onHoverStart()
        else if (!inRect && this.hover) this.onHoverEnd()
        if (!this.isInactive()) {
            event.hoverStateChanged = event.hoverStateChanged || this.hover !== inRect
            this.hover = inRect
            if (!this.hover && !this.toggleState) this.pressed = false
        }
        this.children.forEach((child) => child.onPointerMove(event))
    }

    onPointerDown(event: GuiPointerDownEvent): boolean {
        if (this.isInactive()) return false
        const oldState = this.pressed
        if (this.isInRect(event.sx, event.sy) || this.toggleState) {
            if (!this.pressed && this.onClick) {
                this.pressed = true
            }
        } else {
            this.pressed = false
        }
        let updated = this.pressed !== oldState
        this.children.forEach((child) => updated = child.onPointerDown(event) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    onPointerUp(event: GuiPointerUpEvent): boolean {
        if (this.isInactive()) return false
        const inRect = this.isInRect(event.sx, event.sy)
        let updated = inRect && this.pressed
        if (updated) {
            this.clicked(event)
            this.pressed = updated && this.toggleState
            this.hover = inRect
        }
        this.children.forEach((child) => updated = child.onPointerUp(event) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    clicked(event: GuiPointerDownEvent) {
        this.toggleState = !this.toggleState
        super.clicked(event)
    }

    onPointerLeave(): boolean {
        return false
    }

    setToggleState(toggleState: boolean) {
        if (this.toggleState === toggleState) return
        this.toggleState = toggleState
        if (this.toggleState) this.pressed = true
        this.notifyRedraw()
    }
}
