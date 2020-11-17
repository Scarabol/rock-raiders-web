export class MainMenuButton {

    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    needsRedraw: boolean = false;
    hover: boolean = false;
    pressed: boolean = false;
    actionName: string = '';
    targetIndex: number = 0;

    checkHover(sx: number, sy: number): boolean {
        const hover = sx >= this.x && sx < this.x + this.width && sy >= this.y && sy < this.y + this.height;
        if (this.hover !== hover) this.needsRedraw = true;
        this.hover = hover;
        if (!this.hover) this.pressed = false;
        return this.hover;
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