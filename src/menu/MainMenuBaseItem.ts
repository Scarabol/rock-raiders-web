import { SpriteContext } from '../core/Sprite'
import { UiElementCallback, UiElementState } from './UiElementState'

export class MainMenuBaseItem {
    protected state: UiElementState = new UiElementState()
    zIndex: number = 100
    scrollAffected = false
    targetIndex: number = 0

    constructor(
        public x: number = 0,
        public y: number = 0,
        public width: number = 0,
        public height: number = 0,
        public actionName: string = '',
    ) {
    }

    isHovered(sx: number, sy: number): boolean {
        return sx >= this.x && sx < this.x + this.width && sy >= this.y && sy < this.y + this.height
    }

    setHovered(hovered: boolean) {
        this.state.setHovered(hovered)
    }

    set onHoverChange(callback: UiElementCallback) {
        this.state.onHoverChanged = callback
    }

    onMouseDown(): boolean {
        return this.state.onMouseDown()
    }

    set onPressed(callback: UiElementCallback) {
        this.state.onPressed = callback
    }

    onMouseUp(): boolean {
        return this.state.onMouseUp()
    }

    draw(context: SpriteContext) {
        this.state.clearStateChanged()
    }

    get hover(): boolean {
        return this.state.hover
    }

    get needsRedraw(): boolean {
        return this.state.stateChanged
    }

    set visible(state: boolean) {
        this.state.setHidden(!state)
    }

    set disabled(state: boolean) {
        this.state.setDisabled(state)
    }

    reset() {
        this.state.reset()
    }
}
