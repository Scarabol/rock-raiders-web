import { ScreenLayer } from '../../screen/ScreenLayer'
import { WorldManager } from '../../scene/WorldManager'
import { SelectionType } from '../model/Selectable'
import { GameState } from '../model/GameState'
import { Raider } from '../../scene/model/Raider'
import { EventBus } from '../../event/EventBus'
import { JobCreateEvent } from '../../event/WorldEvents'
import { Surface } from '../../scene/model/map/Surface'
import { EntityDeselected } from '../../event/LocalEvents'
import { FulfillerEntity } from '../../scene/model/FulfillerEntity'
import { SurfaceJob, SurfaceJobType } from '../model/job/SurfaceJob'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventManager'
import { DEV_MODE } from '../../main'
import { MoveJob } from '../model/job/MoveJob'
import { Vector3 } from 'three'

export class GameLayer extends ScreenLayer {

    private worldMgr: WorldManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}

    constructor() {
        super(false, false)
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
    }

    setWorldManager(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
    }

    handlePointerEvent(eventEnum: POINTER_EVENT, event: PointerEvent): boolean {
        if (eventEnum === POINTER_EVENT.MOVE) {
            const intersectionPoint = this.getTerrainPositionFromEvent(event)
            if (intersectionPoint) this.worldMgr.setTorchPosition(intersectionPoint)
        } else if (eventEnum === POINTER_EVENT.UP && event.button === MOUSE_BUTTON.SECONDARY) {
            const downUpDistance = Math.abs(event.x - this.rightDown.x) + Math.abs(event.y - this.rightDown.y)
            if (downUpDistance < 3 && (GameState.selectionType === SelectionType.PILOT || GameState.selectionType === SelectionType.GROUP)) {
                // TODO check for collectable entity first
                const intersectionPoint = this.getTerrainPositionFromEvent(event)
                if (intersectionPoint) {
                    const surface = this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(intersectionPoint)
                    if (surface) {
                        if (surface.isDrillable()) {
                            this.createSurfaceJob(SurfaceJobType.DRILL, surface, intersectionPoint)
                        } else if (surface.hasRubble()) {
                            this.createSurfaceJob(SurfaceJobType.CLEAR_RUBBLE, surface, intersectionPoint)
                        } else if (surface.isWalkable()) {
                            GameState.selectedEntities.forEach((raider: Raider) => raider.setJob(new MoveJob(intersectionPoint)))
                            if (GameState.selectedEntities.length > 0) EventBus.publishEvent(new EntityDeselected())
                        }
                    }
                }
            }
        } else if (eventEnum === POINTER_EVENT.DOWN && event.button === MOUSE_BUTTON.SECONDARY) {
            this.rightDown.x = event.x
            this.rightDown.y = event.y
        }
        this.canvas.dispatchEvent(event)
        return true
    }

    handleKeyEvent(eventEnum: KEY_EVENT, event: KeyboardEvent): boolean {
        if (DEV_MODE && eventEnum === KEY_EVENT.UP) {
            if (GameState.selectionType === SelectionType.SURFACE) {
                GameState.selectedEntities.forEach((s: Surface) => {
                    if (event.key === 'c') {
                        if (!s.surfaceType.floor) s.collapse()
                    } else if (event.key === 'f') {
                        const t = s.terrain.findFallInTarget(s.x, s.y)
                        if (!s.surfaceType.floor) s.createFallin(t[0], t[1])
                    }
                })
                EventBus.publishEvent(new EntityDeselected())
                return true
            }
        }
        return false
    }

    createSurfaceJob(surfaceJobType: SurfaceJobType, surface: Surface, intersectionPoint: Vector3) {
        const surfJob = new SurfaceJob(surfaceJobType, surface)
        GameState.selectedEntities.forEach((e: FulfillerEntity) => {
            if (surfJob.isQualified(e)) {
                e.setJob(surfJob)
            } else if (surface.isWalkable()) {
                e.setJob(new MoveJob(intersectionPoint))
            }
        })
        EventBus.publishEvent(new JobCreateEvent(surfJob))
        surface.updateJobColor()
        if (GameState.selectedEntities.length > 0) EventBus.publishEvent(new EntityDeselected())
    }

    getTerrainPositionFromEvent(event) {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        return this.worldMgr.getTerrainIntersectionPoint(rx, ry)
    }

    handleWheelEvent(event: WheelEvent): boolean {
        this.canvas.dispatchEvent(event)
        return true
    }

}
