export class BaseElement {

    parent: BaseElement = null;
    x: number = 0;
    y: number = 0;
    relX: number = 0;
    relY: number = 0;
    width: number = 0;
    height: number = 0;
    children: BaseElement[] = [];
    hidden: boolean = false;
    disabled: boolean = false;
    hover: boolean = false;
    pressed: boolean = false;

    constructor(parent: BaseElement = null) {
        this.parent = parent;
    }

    addChild<T extends BaseElement>(child: T): T {
        child.parent = this;
        this.children.push(child);
        child.updatePosition();
        return child;
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return;
        this.children.forEach((child) => child.onRedraw(context));
    };

    onClick() {
    }

    isInactive(): boolean {
        for (let parent = this.parent; !!parent; parent = parent.parent) if (parent.isInactive()) return true;
        return this.hidden || this.disabled;
    }

    hide() {
        this.hidden = true;
        this.children.forEach((child) => child.hide());
    }

    show() {
        this.hidden = false;
        this.children.forEach((child) => child.show());
    }

    updatePosition() {
        this.x = this.parent ? this.parent.x + this.relX : this.relX;
        this.y = this.parent ? this.parent.y + this.relY : this.relY;
        this.children.forEach((child) => child.updatePosition());
    }

    isInRect(cx, cy) {
        return cx >= this.x && cy >= this.y && cx < this.x + this.width && cy < this.y + this.height;
    }

    checkHover(cx, cy): boolean {
        if (this.isInactive()) return false;
        const inRect = this.isInRect(cx, cy);
        let updated = this.hover !== inRect;
        this.hover = inRect;
        this.pressed = this.pressed && this.hover;
        // TODO start tooltip timeout (if not already started)
        this.children.forEach((child) => updated = child.checkHover(cx, cy) || updated);
        return updated;
    }

    checkClick(cx, cy): boolean {
        if (this.isInactive()) return false;
        const inRect = this.isInRect(cx, cy);
        let updated = this.pressed !== inRect;
        this.pressed = inRect;
        this.children.forEach((child) => updated = child.checkClick(cx, cy) || updated);
        return updated;
    }

    checkRelease(cx, cy): boolean {
        if (this.isInactive()) return false;
        const inRect = this.isInRect(cx, cy);
        if (inRect && this.pressed) this.onClick();
        let updated = this.release();
        this.children.forEach((child) => updated = child.checkRelease(cx, cy) || updated);
        return updated;
    }

    release(): boolean {
        let updated = this.pressed || this.hover;
        this.pressed = false;
        this.hover = false;
        // no recursion with children here, otherwise children cannot react on release events
        return updated;
    }

    notifyRedraw() {
        if (this.parent) this.parent.notifyRedraw();
    }

}
