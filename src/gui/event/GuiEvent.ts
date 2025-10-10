import { MouseButtonType } from '../../event/EventTypeEnum'

export class GuiEvent {
    constructor(public sx: number, public sy: number) {
    }
}

export class GuiHoverEvent extends GuiEvent {
    hoverStateChanged: boolean = false
}

export class GuiPointerDownEvent extends GuiEvent {
    constructor(sx: number, sy: number, public button: MouseButtonType) {
        super(sx, sy)
    }
}

export class GuiPointerUpEvent extends GuiEvent {
    constructor(sx: number, sy: number, public button: MouseButtonType) {
        super(sx, sy)
    }
}
