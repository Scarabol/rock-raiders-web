import { Frustum, Mesh, Vector2, Vector3 } from 'three'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { DeselectAll, SelectionChanged, SelectionFrameChangeEvent } from '../../event/LocalEvents'
import { JobCreateEvent, MaterialAmountChanged, MonsterEmergeEvent, ShootLaserEvent } from '../../event/WorldEvents'
import { ManVehicleJob } from '../../game/model/job/ManVehicleJob'
import { TrainRaiderJob } from '../../game/model/job/raider/TrainRaiderJob'
import { DEV_MODE, FPV_ENTITY_TURN_SPEED } from '../../params'
import { ScreenLayer } from './ScreenLayer'
import { Cursor } from '../../cfg/PointersCfg'
import { EntityType } from '../../game/model/EntityType'
import { Surface } from '../../game/terrain/Surface'
import { EventKey } from '../../event/EventKeyEnum'
import { CursorManager } from '../CursorManager'
import { CursorTarget, SelectionRaycaster } from '../../scene/SelectionRaycaster'
import { WorldManager } from '../../game/WorldManager'
import { GameState } from '../../game/model/GameState'
import { MoveJob } from '../../game/model/job/MoveJob'
import { MaterialEntity } from '../../game/model/material/MaterialEntity'
import { RaiderInfoComponent } from '../../game/component/RaiderInfoComponent'
import { GameSelection } from '../../game/model/GameSelection'
import { Rect } from '../../core/Rect'
import { EventBroker } from '../../event/EventBroker'
import { TooltipComponent } from '../../game/component/TooltipComponent'
import { WALL_TYPE } from '../../game/terrain/WallType'
import { SceneSelectionComponent } from '../../game/component/SceneSelectionComponent'
import { SaveGameManager } from '../../resource/SaveGameManager'
import { SpriteImage } from '../../core/Sprite'

export class GameLayer extends ScreenLayer {
    private pointerDown?: { x: number, y: number }
    private readonly beforeUnloadListener = (event: BeforeUnloadEvent): string | undefined => {
        if (DEV_MODE) return undefined
        // XXX save complete game state in local storage and allow page reload
        event.preventDefault()
        return event.returnValue = 'Level progress will be lost!'
    }
    cursorRelativePos: Vector2 = new Vector2()

    constructor(readonly worldMgr: WorldManager) {
        super()
        this.ratio = SaveGameManager.calcScreenRatio()
        EventBroker.subscribe(EventKey.SELECTION_CHANGED, () => {
            const cursorTarget = new SelectionRaycaster(this.worldMgr).getFirstCursorTarget(this.cursorRelativePos)
            CursorManager.changeCursor(this.determineCursor(cursorTarget))
        })
        this.addEventListener('pointermove', (event): boolean => {
            const gameEvent = new GamePointerEvent(POINTER_EVENT.MOVE, event)
            ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
            return this.handlePointerMoveEvent(gameEvent)
        })
        this.addEventListener('pointerdown', (event): boolean => {
            if (event.button !== MOUSE_BUTTON.MAIN) return false
            const gameEvent = new GamePointerEvent(POINTER_EVENT.DOWN, event)
            ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
            if (!this.worldMgr.sceneMgr.buildMarker?.buildingType && !this.worldMgr.entityMgr.selection.doubleSelect && GameState.isBirdView) {
                this.pointerDown = {x: gameEvent.canvasX, y: gameEvent.canvasY}
            }
            return false
        })
        this.addEventListener('pointerup', (event): boolean => {
            if (event.button !== MOUSE_BUTTON.MAIN) return false
            const gameEvent = new GamePointerEvent(POINTER_EVENT.DOWN, event)
            ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
            this.handlePointerUpEvent(gameEvent)
            return false
        })
        // signal to screen master for camera controls listening on canvas for events
        ;(['pointerleave', 'mousemove', 'mouseleave'] as (keyof HTMLElementEventMap)[]).forEach((eventType) => {
            this.addEventListener(eventType, (): boolean => false)
        })
        this.addEventListener('keydown', (event): boolean => {
            const gameEvent = new GameKeyboardEvent(KEY_EVENT.DOWN, event)
            return this.handleKeyDownEvent(gameEvent)
        })
        this.addEventListener('keyup', (event): boolean => {
            const gameEvent = new GameKeyboardEvent(KEY_EVENT.UP, event)
            return this.handleKeyUpEvent(gameEvent)
        })
        this.addEventListener('wheel', (): boolean => true) // signal to screen master for camera controls listening on canvas for events
    }

    reset() {
        super.reset()
        this.pointerDown = undefined
        EventBroker.publish(new SelectionFrameChangeEvent(undefined))
    }

    show() {
        super.show()
        window.addEventListener('beforeunload', this.beforeUnloadListener)
    }

    hide() {
        super.hide()
        window.removeEventListener('beforeunload', this.beforeUnloadListener)
    }

    handlePointerMoveEvent(event: GamePointerEvent): boolean {
        if (this.pointerDown && event.pointerType === 'mouse' && !GameState.noMultiSelect) {
            const w = event.canvasX - this.pointerDown.x
            const h = event.canvasY - this.pointerDown.y
            EventBroker.publish(new SelectionFrameChangeEvent(new Rect(this.pointerDown.x, this.pointerDown.y, w, h)))
        }
        this.cursorRelativePos.x = (event.canvasX / this.canvas.width) * 2 - 1
        this.cursorRelativePos.y = -(event.canvasY / this.canvas.height) * 2 + 1
        const cursorTarget = new SelectionRaycaster(this.worldMgr).getFirstCursorTarget(this.cursorRelativePos)
        CursorManager.changeCursor(this.determineCursor(cursorTarget))
        if (event.pointerType === 'mouse' && cursorTarget.intersectionPoint) this.worldMgr.sceneMgr.setCursorFloorPosition(cursorTarget.intersectionPoint)
        this.publishTooltipEvent(cursorTarget)
        this.worldMgr.sceneMgr.buildMarker?.updatePosition(cursorTarget.intersectionPoint)
        const doubleSelection = this.worldMgr.entityMgr.selection.doubleSelect
        if (cursorTarget.intersectionPoint && doubleSelection) {
            doubleSelection.sceneEntity.pointLaserAt(cursorTarget.intersectionPoint)
        }
        return false
    }

    private publishTooltipEvent(cursorTarget: CursorTarget): void {
        const tooltipComponent = [
            cursorTarget.material?.entity,
            cursorTarget.raider?.entity,
            cursorTarget.vehicle?.entity,
            cursorTarget.monster?.entity,
            cursorTarget.fence?.entity,
            cursorTarget.building?.entity,
            cursorTarget.surface?.site?.entity,
            cursorTarget.surface?.entity,
        ].map((e) => {
            if (!e) return null
            return this.worldMgr.ecs.getComponents(e).get(TooltipComponent)
        }).find((c) => !!c)
        if (!tooltipComponent) return
        EventBroker.publish(tooltipComponent.createEvent())
    }

    private handlePointerUpEvent(event: GamePointerEvent) {
        const x = event.canvasX / (this.canvas.width / 2) - 1
        const y = -event.canvasY / (this.canvas.height / 2) + 1
        const cursorTargetSurface = new SelectionRaycaster(this.worldMgr).getSelectionByRay(new Vector2(x, y)).surface
        if (cursorTargetSurface) {
            this.worldMgr.nerpRunner.tutoBlocksById.forEach((surfaces, tutoBlockId) => {
                if (surfaces.includes(cursorTargetSurface)) {
                    GameState.tutoBlockClicks.upsert(tutoBlockId, (current) => (current || 0) + 1)
                }
            })
        }
        if (this.worldMgr.sceneMgr.buildMarker?.buildingType && this.worldMgr.sceneMgr.buildMarker.lastCheck) {
            this.worldMgr.sceneMgr.buildMarker.createBuildingSite()
            return
        }
        const doubleSelect = this.worldMgr.entityMgr.selection.doubleSelect
        if (doubleSelect) {
            EventBroker.publish(new ShootLaserEvent(doubleSelect.entity))
            return
        }
        if (!this.pointerDown) return
        const downUpDistance = Math.abs(event.canvasX - this.pointerDown.x) + Math.abs(event.canvasY - this.pointerDown.y)
        if (downUpDistance < 20) {
            this.cursorRelativePos.x = (event.canvasX / this.canvas.width) * 2 - 1
            this.cursorRelativePos.y = -(event.canvasY / this.canvas.height) * 2 + 1
            if (this.worldMgr.sceneMgr.hasBuildModeSelection()) {
                this.worldMgr.sceneMgr.setBuildModeSelection(undefined)
            } else if (this.worldMgr.entityMgr.selection.raiders.length > 0 || this.worldMgr.entityMgr.selection.vehicles.length > 0) {
                const cursorTarget = new SelectionRaycaster(this.worldMgr).getFirstCursorTarget(this.cursorRelativePos)
                const cursorTargetSurface = cursorTarget.surface
                if (cursorTargetSurface) {
                    this.worldMgr.nerpRunner.tutoBlocksById.forEach((surfaces, tutoBlockId) => {
                        if (surfaces.includes(cursorTargetSurface)) {
                            GameState.tutoBlockClicks.upsert(tutoBlockId, (current) => (current || 0) + 1)
                        }
                    })
                }
                if (cursorTarget.vehicle) {
                    const selectedRaiders = this.worldMgr.entityMgr.selection.raiders
                    if (selectedRaiders.length > 0 && !cursorTarget.vehicle.driver) {
                        const manVehicleJob = new ManVehicleJob(cursorTarget.vehicle)
                        selectedRaiders.some((r) => {
                            if (r.hasTraining(manVehicleJob.requiredTraining)) {
                                r.setJob(manVehicleJob)
                            } else {
                                const requiredTraining = manVehicleJob.requiredTraining
                                const closestTrainingSite = r.findShortestPath(this.worldMgr.entityMgr.getTrainingSiteTargets(requiredTraining))
                                if (!closestTrainingSite) return false
                                r.setJob(new TrainRaiderJob(r.worldMgr.entityMgr, requiredTraining, closestTrainingSite.target.building), manVehicleJob)
                            }
                            EventBroker.publish(new DeselectAll())
                            return true
                        })
                        EventBroker.publish(new JobCreateEvent(manVehicleJob))
                    } else {
                        const selection = new GameSelection()
                        selection.vehicles.push(cursorTarget.vehicle)
                        this.worldMgr.entityMgr.selection.set(selection)
                        EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
                    }
                } else if (cursorTarget.material) {
                    this.worldMgr.entityMgr.selection.assignCarryJob(cursorTarget.material)
                    if (!this.worldMgr.entityMgr.selection.isEmpty()) EventBroker.publish(new DeselectAll())
                } else if (cursorTargetSurface) {
                    if (this.worldMgr.entityMgr.selection.canDrill(cursorTargetSurface)) {
                        const drillJob = cursorTargetSurface.setupDrillJob()
                        if (drillJob) this.worldMgr.entityMgr.selection.assignDrillJob(drillJob)
                    } else if (this.worldMgr.entityMgr.selection.canClear() && cursorTargetSurface.hasRubble()) {
                        const clearJob = cursorTargetSurface.setupClearRubbleJob()
                        if (clearJob) this.worldMgr.entityMgr.selection.assignClearRubbleJob(clearJob)
                    } else if (this.worldMgr.entityMgr.selection.canMove()) {
                        if (cursorTargetSurface.isWalkable()) {
                            this.worldMgr.entityMgr.selection.raiders.forEach((r) => r.setJob(new MoveJob(cursorTargetSurface.getRandomPosition())))
                        }
                        this.worldMgr.entityMgr.selection.vehicles.forEach((v) => v.setJob(new MoveJob(cursorTargetSurface.getCenterWorld2D())))
                    }
                    if (!this.worldMgr.entityMgr.selection.isEmpty()) EventBroker.publish(new DeselectAll())
                } else if (cursorTarget.raider || cursorTarget.building) {
                    const selection = new GameSelection()
                    if (cursorTarget.raider) selection.raiders.push(cursorTarget.raider)
                    selection.building = cursorTarget.building
                    this.worldMgr.entityMgr.selection.set(selection)
                    EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
                } else {
                    const x = (this.pointerDown.x + event.canvasX) / this.canvas.width - 1
                    const y = -(this.pointerDown.y + event.canvasY) / this.canvas.height + 1
                    const selection = new SelectionRaycaster(this.worldMgr).getSelectionByRay(new Vector2(x, y))
                    this.worldMgr.entityMgr.selection.set(selection)
                    EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
                }
            } else {
                const x = (this.pointerDown.x + event.canvasX) / this.canvas.width - 1
                const y = -(this.pointerDown.y + event.canvasY) / this.canvas.height + 1
                const selection = new SelectionRaycaster(this.worldMgr).getSelectionByRay(new Vector2(x, y))
                this.worldMgr.entityMgr.selection.set(selection)
                EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
            }
        } else if (event.pointerType === 'mouse' && !GameState.noMultiSelect) {
            const r1x = (this.pointerDown.x / this.canvas.width) * 2 - 1
            const r1y = -(this.pointerDown.y / this.canvas.height) * 2 + 1
            const r2x = (event.canvasX / this.canvas.width) * 2 - 1
            const r2y = -(event.canvasY / this.canvas.height) * 2 + 1
            const selection = this.getEntitiesInFrustum(r1x, r1y, r2x, r2y)
            this.worldMgr.entityMgr.selection.set(selection)
            EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
        }
        this.pointerDown = undefined
        EventBroker.publish(new SelectionFrameChangeEvent(undefined))
    }

    getEntitiesInFrustum(r1x: number, r1y: number, r2x: number, r2y: number): GameSelection {
        const frustum = this.worldMgr.sceneMgr.cameraBird.getFrustum(r1x, r1y, r2x, r2y)
        const selection = new GameSelection()
        selection.raiders.push(...this.worldMgr.entityMgr.raiders.filter((r) => {
            const pickSphere = this.worldMgr.ecs.getComponents(r.entity).get(SceneSelectionComponent).pickSphere
            return r.isInSelection() && GameLayer.isInFrustum(pickSphere, frustum)
        }))
        const hasRaiderSelected = selection.raiders.length > 0
        selection.vehicles.push(...this.worldMgr.entityMgr.vehicles.filter((v) => {
            const pickSphere = this.worldMgr.ecs.getComponents(v.entity).get(SceneSelectionComponent).pickSphere
            return v.isInSelection() && (!hasRaiderSelected || v.driver) && GameLayer.isInFrustum(pickSphere, frustum)
        }))
        if (selection.isEmpty()) selection.building = this.worldMgr.entityMgr.buildings.find((b) => {
            const pickSphere = this.worldMgr.ecs.getComponents(b.entity).get(SceneSelectionComponent).pickSphere
            return GameLayer.isInFrustum(pickSphere, frustum)
        })
        return selection
    }

    private static isInFrustum(pickSphere: Mesh, frustum: Frustum) {
        if (!pickSphere) return false
        const selectionCenter = new Vector3()
        pickSphere.getWorldPosition(selectionCenter)
        return frustum.containsPoint(selectionCenter)
    }

    handleKeyDownEvent(event: GameKeyboardEvent): boolean {
        const cameraActive = this.worldMgr.sceneMgr.cameraActive
        const selectedEntity = this.worldMgr.entityMgr.selection.getPrimarySelected()
        if ((cameraActive === this.worldMgr.sceneMgr.cameraShoulder || cameraActive === this.worldMgr.sceneMgr.cameraFPV) && !!selectedEntity) {
            if (event.key === 'ArrowLeft' || event.key === 'a') {
                this.worldMgr.sceneMgr.entityTurnSpeed = FPV_ENTITY_TURN_SPEED
                return true
            } else if (event.key === 'ArrowUp' || event.key === 'w') {
                this.worldMgr.sceneMgr.entityMoveMultiplier = 1
                return true
            } else if (event.key === 'ArrowRight' || event.key === 'd') {
                this.worldMgr.sceneMgr.entityTurnSpeed = -FPV_ENTITY_TURN_SPEED
                return true
            } else if (event.key === 'ArrowDown' || event.key === 's') {
                this.worldMgr.sceneMgr.entityMoveMultiplier = -1
                return true
            }
        }
        return false
    }

    handleKeyUpEvent(event: GameKeyboardEvent): boolean {
        if (event.key === ' ') {
            GameState.showObjInfo = !GameState.showObjInfo
            this.worldMgr.entityMgr.raiders.forEach((r) => {
                const infoComponent = r.worldMgr.ecs.getComponents(r.entity).get(RaiderInfoComponent)
                infoComponent.bubbleSprite.updateVisibleState()
                infoComponent.hungerSprite.visible = GameState.showObjInfo && GameState.isBirdView
            })
            return true
        } else if (['ArrowLeft', 'a', 'ArrowRight', 'd'].some((k) => event.key === k)) {
            this.worldMgr.sceneMgr.entityTurnSpeed = 0
        } else if (['ArrowUp', 'w', 'ArrowDown', 's'].some((k) => event.key === k)) {
            this.worldMgr.sceneMgr.entityMoveMultiplier = 0
        } else if (DEV_MODE) {
            if (this.worldMgr.entityMgr.selection.surface) {
                if (event.key === 'c') {
                    this.worldMgr.entityMgr.selection.surface.collapse()
                    EventBroker.publish(new DeselectAll())
                    return true
                } else if (event.key === 'f') {
                    const surface = this.worldMgr.entityMgr.selection.surface
                    if (!surface.surfaceType.floor) {
                        const fallInTarget = surface.neighbors.find((n) => n.isWalkable() && !n.surfaceType.hasErosion)
                        if (fallInTarget) this.worldMgr.sceneMgr.terrain.createFallIn(surface, fallInTarget)
                    }
                    EventBroker.publish(new DeselectAll())
                    return true
                } else if (event.key === 'm') {
                    const surface = this.worldMgr.entityMgr.selection.surface
                    if (surface.wallType === WALL_TYPE.WALL) {
                        EventBroker.publish(new MonsterEmergeEvent(surface))
                    }
                }
            }
            if (event.key === 'h') {
                GameState.numCrystal += 50
                EventBroker.publish(new MaterialAmountChanged())
            }
        }
        return false
    }

    takeScreenshotFromLayer(): Promise<SpriteImage | undefined> {
        return new Promise<SpriteImage | undefined>((resolve) => {
            this.worldMgr.sceneMgr.renderer.screenshotCallback = resolve
        })
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.worldMgr.sceneMgr?.resize(width, height)
    }

    determineCursor(cursorTarget: CursorTarget): Cursor {
        if (this.worldMgr.sceneMgr.hasBuildModeSelection()) {
            return this.worldMgr.sceneMgr.buildMarker?.lastCheck ? 'canBuild' : 'cannotBuild'
        }
        if (cursorTarget.raider) return 'selected'
        if (cursorTarget.vehicle) {
            if (!cursorTarget.vehicle.driver && this.worldMgr.entityMgr.selection.raiders.length > 0) {
                return 'getIn'
            }
            return 'selected'
        }
        if (cursorTarget.monster) return 'selected'
        if (cursorTarget.fence) return 'selected'
        if (cursorTarget.building) return 'selected'
        if (cursorTarget.material) return this.determineMaterialCursor(cursorTarget.material)
        if (cursorTarget.surface) return this.determineSurfaceCursor(cursorTarget.surface)
        return 'standard'
    }

    private determineMaterialCursor(material: MaterialEntity): Cursor {
        if (this.worldMgr.entityMgr.selection.canPickup()) {
            if (material.entityType === EntityType.ORE) {
                return 'pickUpOre'
            } else {
                return 'pickUp'
            }
        }
        return 'selected'
    }

    private determineSurfaceCursor(surface: Surface): Cursor {
        if (this.worldMgr.entityMgr.selection.canMove()) {
            if (surface.surfaceType.digable) {
                if (this.worldMgr.entityMgr.selection.canDrill(surface)) {
                    return 'drill'
                }
            } else if (surface.surfaceType.floor) {
                if (surface.hasRubble() && this.worldMgr.entityMgr.selection.canClear()) {
                    return 'clear'
                }
                return 'manGo'
            }
        }
        return surface.surfaceType.cursor
    }

    onGlobalMouseMoveEvent(e: PointerEvent) {
        const event = new GamePointerEvent(POINTER_EVENT.MOVE, e)
        ;[event.canvasX, event.canvasY] = this.transformCoords(event.clientX, event.clientY)
        this.onGlobalMouseEvent(event)
    }

    onGlobalMouseLeaveEvent(e: PointerEvent) {
        const event = new GamePointerEvent(POINTER_EVENT.MOVE, e)
        ;[event.canvasX, event.canvasY] = this.transformCoords(event.clientX, event.clientY)
        this.onGlobalMouseEvent(event)
    }

    private onGlobalMouseEvent(event: GamePointerEvent) {
        if (!this.active || !SaveGameManager.preferences.edgeScrolling) return
        const screenPanOffset = 4
        let key: string = ''
        if (event.canvasX < screenPanOffset) {
            key = 'KeyA'
        } else if (event.canvasX > this.canvas.width - screenPanOffset) {
            key = 'KeyD'
        }
        if (event.canvasY < screenPanOffset) {
            key = 'KeyW'
        } else if (event.canvasY > this.canvas.height - screenPanOffset) {
            key = 'KeyS'
        }
        this.worldMgr.sceneMgr.birdViewControls.setAutoPan(key)
    }
}
