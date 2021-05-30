import { ButtonCfg } from '../../cfg/ButtonCfg'
import { MOUSE_BUTTON } from '../../event/EventTypeEnum'
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

    checkHover(cx, cy): boolean {
        if (this.isInactive()) return false
        const inRect = this.isInRect(cx, cy)
        let updated = this.hover !== inRect
        this.hover = inRect
        if (!this.hover && !this.toggleState) this.pressedByButton = null
        // TODO start tooltip timeout (if not already started)
        this.children.forEach((child) => updated = child.checkHover(cx, cy) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    checkClick(cx, cy, button: MOUSE_BUTTON): boolean {
        if (this.isInactive()) return false
        const oldState = this.pressedByButton
        if (this.isInRect(cx, cy) || this.toggleState) {
            if (this.pressedByButton === null && ((button === MOUSE_BUTTON.MAIN && this.onClick) ||
                (button === MOUSE_BUTTON.SECONDARY && this.onClickSecondary))) {
                this.pressedByButton = button
            }
        } else {
            this.pressedByButton = null
        }
        let updated = this.pressedByButton !== oldState
        this.children.forEach((child) => updated = child.checkClick(cx, cy, button) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    checkRelease(cx, cy, button: MOUSE_BUTTON): boolean {
        if (this.isInactive()) return false
        const inRect = this.isInRect(cx, cy)
        let updated = inRect && this.pressedByButton !== null
        if (updated) {
            this.clicked(cx, cy, button)
            this.pressedByButton = (updated && this.toggleState) ? button : null
            this.hover = inRect
        }
        this.children.forEach((child) => updated = child.checkRelease(cx, cy, button) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    clicked(cx: number, cy: number, button: MOUSE_BUTTON) {
        this.toggleState = !this.toggleState
        super.clicked(cx, cy, button)
    }

    release(): boolean {
        return false
    }

}

