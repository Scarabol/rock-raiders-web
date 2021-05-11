import { Raycaster, Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameEvent } from '../../event/GameEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { IEventHandler } from '../../event/IEventHandler'
import { ChangeCursor, SelectionChanged } from '../../event/LocalEvents'
import { FulfillerEntity } from '../../game/model/FulfillerEntity'
import { GameState } from '../../game/model/GameState'
import { Job } from '../../game/model/job/Job'
import { MoveJob } from '../../game/model/job/MoveJob'
import { Surface } from '../../game/model/map/Surface'
import { Raider } from '../../game/model/raider/Raider'
import { SelectionType } from '../../game/model/Selectable'
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { DEV_MODE } from '../../params'
import { Cursor } from '../Cursor'
import { ScreenLayer } from './ScreenLayer'

export class GameLayer extends ScreenLayer implements IEventHandler {

    parent: IEventHandler
    worldMgr: WorldManager
    sceneMgr: SceneManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}
    private lastCursor: Cursor = Cursor.Pointer_Standard

    constructor(parent: IEventHandler) {
        super(false, false)
        this.parent = parent
        EventBus.registerEventListener(EventKey.CHANGE_CURSOR, (event: ChangeCursor) => {
            this.lastCursor = event.cursor
        })
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
        this.lastCursor = Cursor.Pointer_Standard
    }

    hide() {
        super.hide()
        this.publishEvent(new ChangeCursor(Cursor.Pointer_Standard))
    }

    handlePointerEvent(event: GamePointerEvent): Promise<boolean> {
        const buildMarker = this.sceneMgr.buildMarker
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            const intersectionPoint = this.getTerrainPositionFromEvent(event)
            if (intersectionPoint) this.sceneMgr.setTorchPosition(intersectionPoint)
            buildMarker.update(intersectionPoint)
            this.updateCursor(event)
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) {
                if (GameState.buildModeSelection && buildMarker.lastCheck) {
                    buildMarker.createBuildingSite()
                    return new Promise<boolean>((resolve) => resolve(true))
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
                                    GameState.selectedEntities.forEach((raider: Raider) => raider.setJob(new MoveJob(intersectionPoint)))
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

    updateCursor(event) {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneMgr.camera)
        const cursor = this.determineCursor(raycaster)
        if (cursor !== this.lastCursor) {
            this.publishEvent(new ChangeCursor(cursor))
        }
    }

    determineCursor(raycaster: Raycaster): Cursor {
        let intersects = raycaster.intersectObjects(GameState.raiders.map((r) => r.pickSphere))
        if (intersects.length > 0) {
            return Cursor.Pointer_Selected
        } else {
            let intersects = raycaster.intersectObjects(GameState.buildings.map((b) => b.pickSphere))
            if (intersects.length > 0) {
                return Cursor.Pointer_Selected
            } else {
                intersects = raycaster.intersectObjects(this.sceneMgr.terrain.floorGroup.children)
                if (intersects.length > 0) {
                    const userData = intersects[0].object.userData
                    if (userData && userData.hasOwnProperty('surface')) {
                        const surface = userData['surface'] as Surface
                        if (surface) {
                            return surface.surfaceType.cursor
                        }
                    }
                }
            }
        }
        return Cursor.Pointer_Standard
    }

    handleKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        if (DEV_MODE && event.eventEnum === KEY_EVENT.UP) {
            if (GameState.selectionType === SelectionType.SURFACE) {
                if (event.code === 'KeyC') {
                    GameState.selectedEntities.forEach((s: Surface) => {
                        if (!s.surfaceType.floor) s.collapse()
                    })
                    this.publishEvent(new SelectionChanged())
                    return new Promise((resolve) => resolve(true))
                } else if (event.code === 'KeyF') {
                    GameState.selectedEntities.forEach((s: Surface) => {
                        const t = s.terrain.findFallInTarget(s.x, s.y)
                        if (!s.surfaceType.floor) s.createFallin(t[0], t[1])
                    })
                    this.publishEvent(new SelectionChanged())
                    return new Promise((resolve) => resolve(true))
                }
            }
        }
        this.canvas.dispatchEvent(new KeyboardEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
    }

    assignSurfaceJob(job: Job, surface: Surface, intersectionPoint: Vector2) {
        if (!job) return
        GameState.selectedEntities.forEach((e: FulfillerEntity) => {
            if (e.hasTool(job.getRequiredTool()) && e.hasTraining(job.getRequiredTraining())) {
                e.setJob(job)
            } else if (surface.isWalkable()) {
                e.setJob(new MoveJob(intersectionPoint))
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
