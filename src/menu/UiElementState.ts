export type UiElementCallback = () => any

export class UiElementState {

    hidden: boolean = false
    disabled: boolean = false
    protected hovered: boolean = false
    protected down: boolean = false
    stateChanged: boolean = false

    onPressed: UiElementCallback = null
    onHoverChanged: UiElementCallback = null
    onShowTooltip: UiElementCallback = null

    constructor(
        protected readonly hiddenDefault: boolean = false,
        protected readonly disabledDefault: boolean = false,
    ) {
        this.hidden = this.hiddenDefault
        this.disabled = this.disabledDefault
    }

    reset() {
        this.stateChanged = this.hovered || this.down || this.hiddenDefault !== this.hiddenDefault || this.disabled !== this.disabledDefault
        this.hovered = false
        this.down = false
        this.hidden = this.hiddenDefault
        this.disabled = this.disabledDefault
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
        if (this.hovered && this.onPressed) this.onPressed()
        return true
    }

    setHovered(hovered: boolean) {
        if (this.disabled || this.hidden) return
        if (hovered && this.onShowTooltip) this.onShowTooltip()
        if (this.hovered === hovered) return
        this.stateChanged = true
        this.hovered = hovered
        if (this.onHoverChanged) this.onHoverChanged()
    }

    setDisabled(disabled: boolean) {
        if (this.disabled === disabled) return
        this.stateChanged = true
        this.hovered = false
        this.disabled = disabled
    }

    setHidden(hidden: boolean) {
        if (this.hidden === hidden) return
        this.hovered = false
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
