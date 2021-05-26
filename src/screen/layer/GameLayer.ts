import { Vector2 } from 'three'
import { EventKey } from '../../event/EventKeyEnum'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameEvent } from '../../event/GameEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { IEventHandler } from '../../event/IEventHandler'
import { DeselectAll } from '../../event/LocalEvents'
import { EntityManager } from '../../game/EntityManager'
import { FulfillerEntity } from '../../game/model/FulfillerEntity'
import { Job } from '../../game/model/job/Job'
import { MoveJob } from '../../game/model/job/raider/MoveJob'
import { Surface } from '../../game/model/map/Surface'
import { SelectionType } from '../../game/model/Selectable'
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { DEV_MODE } from '../../params'
import { ScreenLayer } from './ScreenLayer'

export class GameLayer extends ScreenLayer implements IEventHandler {

    parent: IEventHandler
    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}

    constructor(parent: IEventHandler) {
        super(false, false)
        this.parent = parent
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
    }

    handlePointerEvent(event: GamePointerEvent): Promise<boolean> {
        const terrainIntersectionPoint = this.getTerrainPositionFromEvent(event)
        const buildMarker = this.sceneMgr.buildMarker
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            if (terrainIntersectionPoint) this.sceneMgr.setTorchPosition(terrainIntersectionPoint)
            buildMarker.update(terrainIntersectionPoint)
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) {
                buildMarker.createBuildingSite()
            } else if (event.button === MOUSE_BUTTON.SECONDARY) {
                const downUpDistance = Math.abs(event.clientX - this.rightDown.x) + Math.abs(event.clientY - this.rightDown.y)
                if (downUpDistance < 3) {
                    if (this.sceneMgr.hasBuildModeSelection()) {
                        this.sceneMgr.setBuildModeSelection(null)
                    } else if (this.entityMgr.selectionType === SelectionType.RAIDER || this.entityMgr.selectionType === SelectionType.GROUP || this.entityMgr.selectionType === SelectionType.VEHICLE_MANED) {
                        // TODO check for vehicles and collectables entity first
                        if (terrainIntersectionPoint) {
                            const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorldXZ(terrainIntersectionPoint.x, terrainIntersectionPoint.y)
                            if (surface) {
                                if (surface.isDrillable()) {
                                    this.assignSurfaceJob(surface.createDrillJob(), surface, terrainIntersectionPoint)
                                } else if (surface.hasRubble()) {
                                    this.assignSurfaceJob(surface.createClearRubbleJob(), surface, terrainIntersectionPoint)
                                } else if (surface.isWalkable()) {
                                    this.entityMgr.selectedEntities.forEach((f: FulfillerEntity) => f.setJob(new MoveJob(terrainIntersectionPoint)))
                                    if (this.entityMgr.selectedEntities.length > 0) this.publishEvent(new DeselectAll())
                                }
                            }
                        }
                    }
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.SECONDARY) {
                this.rightDown.x = event.clientX
                this.rightDown.y = event.clientY
            }
        }
        this.canvas.dispatchEvent(new PointerEvent(event.type, event))
        this.canvas.ownerDocument.dispatchEvent(new PointerEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
    }

    handleKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        if (DEV_MODE && event.eventEnum === KEY_EVENT.UP) {
            if (this.entityMgr.selectionType === SelectionType.SURFACE) {
                if (event.code === 'KeyC') {
                    this.entityMgr.selectedSurface?.collapse()
                    this.publishEvent(new DeselectAll())
                } else if (event.code === 'KeyF') {
                    const s = this.entityMgr.selectedSurface
                    if (s) {
                        const t = s.terrain.findFallInTarget(s.x, s.y)
                        if (!s.surfaceType.floor) s.createFallin(t[0], t[1])
                        this.publishEvent(new DeselectAll())
                    }
                }
            }
        }
        this.canvas.dispatchEvent(new KeyboardEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
    }

    assignSurfaceJob(job: Job, surface: Surface, intersectionPoint: Vector2) {
        if (!job) return
        this.entityMgr.selectedEntities.forEach((f: FulfillerEntity) => {
            if (f.isPrepared(job)) {
                f.setJob(job)
            } else if (surface.isWalkable()) {
                f.setJob(new MoveJob(intersectionPoint))
            }
        })
        if (this.entityMgr.selectedEntities.length > 0) this.publishEvent(new DeselectAll())
    }

    getTerrainPositionFromEvent(event): Vector2 {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        return this.sceneMgr.getTerrainIntersectionPoint(rx, ry)
    }

    handleWheelEvent(event: GameWheelEvent): Promise<boolean> {
        this.canvas.dispatchEvent(new WheelEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
    }

    publishEvent(event: GameEvent): void {
        this.parent?.publishEvent(event)
    }

    registerEventListener(eventKey: EventKey, callback: (GameEvent) => any): void {
        this.parent.registerEventListener(eventKey, callback)
    }

}
