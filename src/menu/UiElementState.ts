export type UiElementCallback = () => void

export class UiElementState {

    hidden: boolean = false
    disabled: boolean = false
    protected hovered: boolean = false
    protected down: boolean = false
    stateChanged: boolean = false

    onPressed?: UiElementCallback
    onHoverChanged?: UiElementCallback
    onShowTooltip?: UiElementCallback
    onHideTooltip?: UiElementCallback

    reset() {
        this.stateChanged = this.hovered || this.down || this.hidden || this.disabled
        this.hovered = false
        this.onHideTooltip?.()
        this.down = false
        this.hidden = false
        this.disabled = false
    }

    clearStateChanged() {
        this.stateChanged = false
    }

    onMouseDown(): boolean {
        if (!this.hovered || this.disabled || this.hidden) return false
        if (!this.down) this.stateChanged = true
        this.down = true
        return true
    }

    onMouseUp(): boolean {
        if (!this.down || this.disabled || this.hidden) return false
        this.stateChanged = true
        this.down = false
        if (this.hovered && this.onPressed) {
            this.onHideTooltip?.()
            this.onPressed()
        }
        return true
    }

    setHovered(hovered: boolean) {
        if (this.disabled || this.hidden) return
        if (this.hovered === hovered) return
        if (hovered) {
            this.onShowTooltip?.()
        } else {
            this.onHideTooltip?.()
        }
        this.stateChanged = true
        this.hovered = hovered
        this.onHoverChanged?.()
    }

    setDisabled(disabled: boolean) {
        if (this.disabled === disabled) return
        this.stateChanged = true
        this.hovered = false
        this.onHideTooltip?.()
        this.disabled = disabled
    }

    setHidden(hidden: boolean) {
        if (this.hidden === hidden) return
        this.hovered = false
        this.onHideTooltip?.()
        this.hidden = hidden
    }

    get visible(): boolean {
        return !this.hidden
    }

    get hover(): boolean {
        return this.hovered
    }

    get pressed(): boolean {
        return this.down
    }
}
