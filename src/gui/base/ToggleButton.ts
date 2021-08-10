import { ButtonCfg } from '../../cfg/ButtonCfg'
import { MOUSE_BUTTON } from '../../event/EventTypeEnum'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from '../event/GuiEvent'
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

    checkHover(event: GuiHoverEvent): void {
        if (this.isInactive()) return
        const inRect = this.isInRect(event.sx, event.sy)
        event.hoverStateChanged = event.hoverStateChanged || this.hover !== inRect
        this.hover = inRect
        if (!this.hover && !this.toggleState) this.pressedByButton = null
        // TODO start tooltip timeout (if not already started)
        this.children.forEach((child) => child.checkHover(event))
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    checkClick(event: GuiClickEvent): boolean {
        if (this.isInactive()) return false
        const oldState = this.pressedByButton
        if (this.isInRect(event.sx, event.sy) || this.toggleState) {
            if (this.pressedByButton === null && ((event.button === MOUSE_BUTTON.MAIN && this.onClick) ||
                (event.button === MOUSE_BUTTON.SECONDARY && this.onClickSecondary))) {
                this.pressedByButton = event.button
            }
        } else {
            this.pressedByButton = null
        }
        let updated = this.pressedByButton !== oldState
        this.children.forEach((child) => updated = child.checkClick(event) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    checkRelease(event: GuiReleaseEvent): boolean {
        if (this.isInactive()) return false
        const inRect = this.isInRect(event.sx, event.sy)
        let updated = inRect && this.pressedByButton !== null
        if (updated) {
            this.clicked(event)
            this.pressedByButton = (updated && this.toggleState) ? event.button : null
            this.hover = inRect
        }
        this.children.forEach((child) => updated = child.checkRelease(event) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    clicked(event: GuiClickEvent) {
        this.toggleState = !this.toggleState
        super.clicked(event)
    }

    release(): boolean {
        return false
    }
}

