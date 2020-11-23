import { ResourceManager } from '../resource/ResourceManager';
import { MainMenuLabelButton } from './MainMenuLabelButton';
import { ScaledLayer } from '../screen/ScreenLayer';
import { MenuCfg } from '../resource/wadworker/MenuCfg';
import { BitmapFont } from '../core/BitmapFont';
import { MOUSE_BUTTON } from '../event/EventManager';
import { MainMenuScreen } from '../screen/MainMenuScreen';
import { MainMenuIconButton } from './MainMenuIconButton';
import { MainMenuButton } from './MainMenuButton';
import { LevelsCfg } from '../resource/wadworker/LevelsCfg';
import { MainMenuLevelButton } from './MainMenuLevelButton';

export class MainMenuLayer extends ScaledLayer {

    screen: MainMenuScreen;
    cfg: MenuCfg;
    fullName: string;
    titleImage: HTMLCanvasElement;
    title: string;
    menuFont: BitmapFont;
    loFont: BitmapFont;
    hiFont: BitmapFont;
    menuImage: HTMLCanvasElement;
    items: MainMenuButton[] = [];
    scrollY: number = 0;

    constructor(screen: MainMenuScreen, menuCfg: MenuCfg) {
        super();
        this.screen = screen;
        this.cfg = menuCfg;
        this.fullName = menuCfg.fullName.replace(/_/g, ' ');
        this.title = menuCfg.title.replace(/_/g, ' ');
        this.menuFont = menuCfg.menuFont ? ResourceManager.getBitmapFont(menuCfg.menuFont) : null;
        this.loFont = menuCfg.loFont ? ResourceManager.getBitmapFont(menuCfg.loFont) : null;
        this.hiFont = menuCfg.hiFont ? ResourceManager.getBitmapFont(menuCfg.hiFont) : null;
        this.menuImage = menuCfg.menuImage ? ResourceManager.getImage(menuCfg.menuImage) : null;
        this.titleImage = this.loFont.createTextImage(this.fullName);

        menuCfg.items.forEach((item) => {
            if (item.label) {
                this.items.push(new MainMenuLabelButton(this, item));
            } else {
                this.items.push(new MainMenuIconButton(this, item));
            }
        });

        if (this.title === 'Levels') { // TODO refactor: move to separate class
            const levelsCfg: LevelsCfg = ResourceManager.getResource('Levels');
            Object.keys(levelsCfg.levelsByName).forEach((levelKey) => {
                const level = levelsCfg.levelsByName[levelKey];
                this.items.push(new MainMenuLevelButton(this, levelKey, level));
            });
        }

        this.onRedraw = (context) => {
            context.drawImage(this.menuImage, 0, -this.scrollY);
            if (menuCfg.displayTitle) context.drawImage(this.titleImage, (this.fixedWidth - this.titleImage.width) / 2, this.cfg.position[1]);
            this.items.forEach((item) => item.draw(context));
        };
    }

    handlePointerEvent(eventType: string, event: PointerEvent): boolean {
        if (eventType === 'pointermove') { // TODO scroll when close to menu top/bottom border
            let [sx, sy] = this.toScaledCoords(event.clientX, event.clientY);
            sy += this.scrollY;
            let hovered = false;
            this.items.forEach((item) => {
                if (!hovered) {
                    hovered = item.checkHover(sx, sy);
                } else {
                    if (item.hover) item.needsRedraw = true;
                    item.hover = false;
                    item.setReleased();
                }
            });
        } else if (eventType === 'pointerdown') {
            if (event.button === MOUSE_BUTTON.MAIN) {
                this.items.forEach((item) => item.checkSetPressed());
            }
        } else if (eventType === 'pointerup') {
            if (event.button === MOUSE_BUTTON.MAIN) {
                this.items.forEach((item) => {
                    if (item.pressed) {
                        item.setReleased();
                        if (item.actionName.toLowerCase() === 'next') {
                            this.screen.showMainMenu(item.targetIndex);
                        } else if (item.actionName.toLowerCase() === 'selectlevel') {
                            this.screen.selectLevel((item as MainMenuLevelButton).levelKey);
                        } else {
                            console.warn('not implemented: ' + item.actionName + ' - ' + item.targetIndex);
                        }
                    }
                });
            }
        }
        if (this.needsRedraw()) this.redraw();
        return false;
    }

    handleWheelEvent(eventType: string, event: WheelEvent): boolean {
        if (!this.cfg.canScroll) return false;
        this.scrollY = Math.min(Math.max(this.scrollY + event.deltaY, 0), this.menuImage.height - this.fixedHeight);
        this.redraw();
        return true;
    }

    needsRedraw(): boolean {
        return this.items.some((item) => item.needsRedraw);
    }

}
