import { Vector2 } from 'three'
import { EventKey } from '../../event/EventKeyEnum'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameEvent } from '../../event/GameEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { IEventHandler } from '../../event/IEventHandler'
import { SelectionChanged } from '../../event/LocalEvents'
import { FulfillerEntity } from '../../game/model/FulfillerEntity'
import { GameState } from '../../game/model/GameState'
import { Job } from '../../game/model/job/Job'
import { MoveJob } from '../../game/model/job/MoveJob'
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
        const buildMarker = this.sceneMgr.buildMarker
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            const intersectionPoint = this.getTerrainPositionFromEvent(event)
            if (intersectionPoint) this.sceneMgr.setTorchPosition(intersectionPoint)
            buildMarker.update(intersectionPoint)
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) {
                if (GameState.buildModeSelection && buildMarker.lastCheck) {
                    buildMarker.createBuildingSite()
                }
            } else if (event.button === MOUSE_BUTTON.SECONDARY) {
                const downUpDistance = Math.abs(event.clientX - this.rightDown.x) + Math.abs(event.clientY - this.rightDown.y)
                if (downUpDistance < 3) {
                    if (GameState.selectionType === SelectionType.RAIDER || GameState.selectionType === SelectionType.GROUP) {
                        // TODO check for collectable entity first
                        const intersectionPoint = this.getTerrainPositionFromEvent(event)
                        if (intersectionPoint) {
                            const surface = this.sceneMgr.terrain.getSurfaceFromWorldXZ(intersectionPoint.x, intersectionPoint.y)
                            if (surface) {
                                if (surface.isDrillable()) {
                                    this.assignSurfaceJob(surface.createDrillJob(), surface, intersectionPoint)
                                } else if (surface.hasRubble()) {
                                    this.assignSurfaceJob(surface.createClearRubbleJob(), surface, intersectionPoint)
                                } else if (surface.isWalkable()) {
                                    GameState.selectedEntities.forEach((f: FulfillerEntity) => f.setJob(new MoveJob(intersectionPoint)))
                                    if (GameState.selectedEntities.length > 0) this.publishEvent(new SelectionChanged())
                                }
                            }
                        }
                    } else if (GameState.buildModeSelection) {
                        GameState.buildModeSelection = null
                        buildMarker.hideAllMarker()
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
        return new Promise((resolve) => resolve(true))
    }

    handleKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        if (DEV_MODE && event.eventEnum === KEY_EVENT.UP) {
            if (GameState.selectionType === SelectionType.SURFACE) {
                if (event.code === 'KeyC') {
                    GameState.selectedSurface?.collapse()
                    this.publishEvent(new SelectionChanged())
                } else if (event.code === 'KeyF') {
                    const s = GameState.selectedSurface
                    if (s) {
                        const t = s.terrain.findFallInTarget(s.x, s.y)
                        if (!s.surfaceType.floor) s.createFallin(t[0], t[1])
                        this.publishEvent(new SelectionChanged())
                    }
                }
            }
        }
        this.canvas.dispatchEvent(new KeyboardEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
    }

    assignSurfaceJob(job: Job, surface: Surface, intersectionPoint: Vector2) {
        if (!job) return
        GameState.selectedEntities.forEach((f: FulfillerEntity) => {
            if (f.hasTool(job.getRequiredTool()) && f.hasTraining(job.getRequiredTraining())) {
                f.setJob(job)
            } else if (surface.isWalkable()) {
                f.setJob(new MoveJob(intersectionPoint))
            }
        })
        if (GameState.selectedEntities.length > 0) this.publishEvent(new SelectionChanged())
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
