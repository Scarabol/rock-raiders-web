import { ScreenLayer } from '../../screen/ScreenLayer';
import { WorldManager } from '../../scene/WorldManager';
import { SelectionType } from '../model/Selectable';
import { GameState } from '../model/GameState';
import { Raider } from '../../scene/model/Raider';
import { MoveJob } from '../model/job/Job';
import { EventBus } from '../../event/EventBus';
import { JobCreateEvent } from '../../event/WorldEvents';
import { Surface } from '../../scene/model/map/Surface';
import { EntityDeselected } from '../../event/LocalEvents';
import { FulfillerEntity } from '../../scene/model/FulfillerEntity';
import { SurfaceJob, SurfaceJobType } from '../model/job/SurfaceJob';
import { MOUSE_BUTTON } from '../../event/EventManager';

export class GameLayer extends ScreenLayer {

    private worldMgr: WorldManager;

    constructor() {
        super(false, false);
    }

    setWorldManager(worldMgr: WorldManager) {
        this.worldMgr = worldMgr;
    }

    handlePointerEvent(eventType: string, event: PointerEvent): boolean {
        if (eventType === 'pointermove') {
            const intersectionPoint = this.getTerrainPositionFromEvent(event);
            if (intersectionPoint) this.worldMgr.setTorchPosition(intersectionPoint);
        } else if (eventType === 'pointerup' && event.button === MOUSE_BUTTON.SECONDARY) {
            if (GameState.selectionType === SelectionType.PILOT || GameState.selectionType === SelectionType.GROUP) {
                // TODO check for collectable entity first
                const intersectionPoint = this.getTerrainPositionFromEvent(event);
                if (intersectionPoint) {
                    const surface = this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(intersectionPoint);
                    if (surface) {
                        if (surface.isDrillable()) {
                            this.createSurfaceJob(SurfaceJobType.DRILL, surface);
                        } else if (surface.hasRubble()) {
                            this.createSurfaceJob(SurfaceJobType.CLEAR_RUBBLE, surface);
                        } else if (surface.isWalkable()) {
                            GameState.selectedEntities.forEach((raider: Raider) => raider.setJob(new MoveJob(intersectionPoint)));
                            if (GameState.selectedEntities.length > 0) EventBus.publishEvent(new EntityDeselected());
                        }
                    }
                }
            }
        }
        this.canvas.dispatchEvent(event);
        return true;
    }

    handleKeyEvent(eventType: string, event: KeyboardEvent): boolean {
        if (eventType === 'keyup') {
            if (GameState.selectionType === SelectionType.SURFACE) {
                GameState.selectedEntities.forEach((s: Surface) => {
                    if (event.key === 'c') {
                        if (!s.surfaceType.floor) s.collapse();
                    } else if (event.key === 'f') {
                        const t = s.terrain.findFallInTarget(s.x, s.y);
                        if (!s.surfaceType.floor) s.createFallin(t[0], t[1]);
                    }
                });
                EventBus.publishEvent(new EntityDeselected());
                return true;
            }
        }
        return false;
    }

    createSurfaceJob(surfaceJobType: SurfaceJobType, surface: Surface) {
        const surfJob = new SurfaceJob(surfaceJobType, surface);
        GameState.selectedEntities.forEach((e: FulfillerEntity) => {
            if (surfJob.isQualified(e)) e.setJob(surfJob);
        });
        EventBus.publishEvent(new JobCreateEvent(surfJob));
        surface.updateJobColor();
        if (GameState.selectedEntities.length > 0) EventBus.publishEvent(new EntityDeselected());
    }

    getTerrainPositionFromEvent(event) {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY);
        const rx = (cx / this.canvas.width) * 2 - 1;
        const ry = -(cy / this.canvas.height) * 2 + 1;
        return this.worldMgr.getTerrainIntersectionPoint(rx, ry);
    }

    handleWheelEvent(eventType: string, event: WheelEvent): boolean {
        this.canvas.dispatchEvent(event);
        return true;
    }

}
