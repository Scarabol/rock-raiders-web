import { ButtonCfg } from '../../../cfg/ButtonsCfg'
import { BaseElement } from './BaseElement'
import { Button } from './Button'

export class ToggleButton extends Button {

    toggleState: boolean = false

    constructor(parent: BaseElement, btnCfg: ButtonCfg) {
        super(parent, btnCfg)
    }

    checkHover(cx, cy): boolean {
        if (this.isInactive()) return false
        const inRect = this.isInRect(cx, cy)
        let updated = this.hover !== inRect
        this.hover = inRect
        this.pressed = (this.pressed && this.hover) || this.toggleState
        // TODO start tooltip timeout (if not already started)
        this.children.forEach((child) => updated = child.checkHover(cx, cy) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    checkClick(cx, cy): boolean {
        if (this.isInactive()) return false
        const isPressed = this.isInRect(cx, cy) || this.toggleState
        let updated = this.pressed !== isPressed
        this.pressed = isPressed
        this.children.forEach((child) => updated = child.checkClick(cx, cy) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    checkRelease(cx, cy): boolean {
        if (this.isInactive()) return false
        const inRect = this.isInRect(cx, cy)
        let updated = inRect && this.pressed
        if (updated) {
            this.toggleState = !this.toggleState
            this.onClick()
            this.pressed = updated && this.toggleState
            this.hover = inRect
        }
        this.children.forEach((child) => updated = child.checkRelease(cx, cy) || updated)
        if (updated) this.notifyRedraw()
        return updated
    }

    release(): boolean {
        return false
    }

}

