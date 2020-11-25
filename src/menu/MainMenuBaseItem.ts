export class MainMenuBaseItem {

    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    zIndex: number = 100;
    scrollAffected = false;
    needsRedraw: boolean = false;
    hover: boolean = false;
    pressed: boolean = false;
    actionName: string = '';
    targetIndex: number = 0;

    static compareZ(left: MainMenuBaseItem, right: MainMenuBaseItem) {
        return left.zIndex === right.zIndex ? 0 : left.zIndex > right.zIndex ? -1 : 1;
    }

    checkHover(sx: number, sy: number): boolean {
        const hover = sx >= this.x && sx < this.x + this.width && sy >= this.y && sy < this.y + this.height;
        if (this.hover !== hover) {
            this.hover = hover;
            this.needsRedraw = true;
            this.onHoverChange();
        }
        if (!this.hover) this.pressed = false;
        return this.hover;
    }

    onHoverChange() {
    }

    checkSetPressed() {
        if (!this.hover) return;
        if (!this.pressed) this.needsRedraw = true;
        this.pressed = true;
    }

    setReleased() {
        if (this.pressed) this.needsRedraw = true;
        this.pressed = false;
    }

    draw(context: CanvasRenderingContext2D) {
        this.needsRedraw = false;
    }

}