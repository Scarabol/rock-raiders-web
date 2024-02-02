import { Vector2 } from 'three'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { DeselectAll, SelectionChanged, SelectionFrameChangeEvent } from '../../event/LocalEvents'
import { JobCreateEvent } from '../../event/WorldEvents'
import { EntityManager } from '../../game/EntityManager'
import { ManVehicleJob } from '../../game/model/job/ManVehicleJob'
import { TrainRaiderJob } from '../../game/model/job/raider/TrainRaiderJob'
import { SceneManager } from '../../game/SceneManager'
import { DEV_MODE, TOOLTIP_DELAY_SFX, TOOLTIP_DELAY_TEXT_SCENE } from '../../params'
import { ScreenLayer } from './ScreenLayer'
import { Cursor } from '../../resource/Cursor'
import { EntityType } from '../../game/model/EntityType'
import { Surface } from '../../game/terrain/Surface'
import { EventKey } from '../../event/EventKeyEnum'
import { ChangeCursor, ChangeTooltip } from '../../event/GuiCommand'
import { CursorTarget, SelectionRaycaster } from '../../scene/SelectionRaycaster'
import { WorldManager } from '../../game/WorldManager'
import { GameState } from '../../game/model/GameState'
import { MoveJob } from '../../game/model/job/MoveJob'
import { MaterialEntity } from '../../game/model/material/MaterialEntity'
import { RaiderInfoComponent } from '../../game/component/RaiderInfoComponent'
import { GameSelection } from '../../game/model/GameSelection'
import { Rect } from '../../core/Rect'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { HealthComponent } from '../../game/component/HealthComponent'

export class GameLayer extends ScreenLayer {
    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    private pointerDown: { x: number, y: number } = null
    private readonly beforeUnloadListener = (event: BeforeUnloadEvent): string => {
        if (DEV_MODE) return undefined
        // XXX save complete game state in local storage and allow page reload
        event.preventDefault()
        return event.returnValue = 'Level progress will be lost!'
    }
    cursorRelativePos: Vector2 = new Vector2()

    constructor() {
        super()
        EventBroker.subscribe(EventKey.SELECTION_CHANGED, () => {
            const cursorTarget = new SelectionRaycaster(this.worldMgr).getFirstCursorTarget(this.cursorRelativePos)
            EventBroker.publish(new ChangeCursor(this.determineCursor(cursorTarget)))
        })
        this.addEventListener('pointerleave', (): boolean => {
            // signal to screen master for camera controls listening on canvas for events
            return false
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
            if (!this.sceneMgr.buildMarker.buildingType) this.pointerDown = {x: gameEvent.canvasX, y: gameEvent.canvasY}
            return false
        })
        this.addEventListener('pointerup', (event): boolean => {
            if (event.button !== MOUSE_BUTTON.MAIN) return false
            const gameEvent = new GamePointerEvent(POINTER_EVENT.DOWN, event)
            ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
            this.handlePointerUpEvent(gameEvent)
            return false
        })
        this.addEventListener('keyup', (event): boolean => {
            const gameEvent = new GameKeyboardEvent(KEY_EVENT.UP, event)
            return this.handleKeyUpEvent(gameEvent)
        })
        this.addEventListener('wheel', (): boolean => true) // signal to screen master for camera controls listening on canvas for events
    }

    reset() {
        super.reset()
        this.pointerDown = null
        EventBroker.publish(new SelectionFrameChangeEvent(null))
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
        if (this.pointerDown && event.pointerType === 'mouse') {
            const w = event.canvasX - this.pointerDown.x
            const h = event.canvasY - this.pointerDown.y
            EventBroker.publish(new SelectionFrameChangeEvent(new Rect(this.pointerDown.x, this.pointerDown.y, w, h)))
        }
        this.cursorRelativePos.x = (event.canvasX / this.canvas.width) * 2 - 1
        this.cursorRelativePos.y = -(event.canvasY / this.canvas.height) * 2 + 1
        const cursorTarget = new SelectionRaycaster(this.worldMgr).getFirstCursorTarget(this.cursorRelativePos)
        EventBroker.publish(new ChangeCursor(this.determineCursor(cursorTarget)))
        if (cursorTarget.intersectionPoint) this.sceneMgr.setCursorFloorPosition(cursorTarget.intersectionPoint)
        if (cursorTarget.surface) {
            const site = cursorTarget.surface.site
            if (site?.buildingType) {
                const objectKey = EntityType[site.buildingType.entityType].toString().replace('_', '').toLowerCase()
                const tooltipText = GameConfig.instance.objectNamesCfg.get(objectKey)
                if (tooltipText) EventBroker.publish(new ChangeTooltip(tooltipText, TOOLTIP_DELAY_TEXT_SCENE, null, null, null, site))
            } else {
                const tooltip = GameConfig.instance.surfaceTypeDescriptions.get(cursorTarget.surface.surfaceType.name.toLowerCase())
                if (tooltip) EventBroker.publish(new ChangeTooltip(tooltip[0], TOOLTIP_DELAY_TEXT_SCENE, tooltip[1], TOOLTIP_DELAY_SFX))
            }
        }
        if (cursorTarget.entityType) {
            const objectKey = EntityType[cursorTarget.entityType].toString().replace('_', '').toLowerCase()
            let tooltipText = GameConfig.instance.objectNamesCfg.get(objectKey)
            let energy = 0
            if (cursorTarget.building) {
                const upgradeName = GameConfig.instance.upgradeNames[cursorTarget.building.level - 1]
                if (upgradeName) tooltipText += ` (${upgradeName})`
                energy = Math.round(this.worldMgr.ecs.getComponents(cursorTarget.building.entity)?.get(HealthComponent)?.health ?? 0)
            }
            if (tooltipText) EventBroker.publish(new ChangeTooltip(tooltipText, TOOLTIP_DELAY_TEXT_SCENE, null, null, cursorTarget.raider, null, null, energy))
        }
        this.sceneMgr.buildMarker.updatePosition(cursorTarget.intersectionPoint)
        const doubleSelection = this.entityMgr.selection.doubleSelect
        if (cursorTarget.intersectionPoint && doubleSelection) {
            const worldPos = this.sceneMgr.getFloorPosition(cursorTarget.intersectionPoint)
            doubleSelection.sceneEntity.pointLaserAt(worldPos)
        }
        return false
    }

    private handlePointerUpEvent(event: GamePointerEvent) {
        if (this.sceneMgr.buildMarker.buildingType && this.sceneMgr.buildMarker.lastCheck) {
            this.sceneMgr.buildMarker.createBuildingSite()
        } else if (this.pointerDown) {
            const downUpDistance = Math.abs(event.canvasX - this.pointerDown.x) + Math.abs(event.canvasY - this.pointerDown.y)
            if (downUpDistance < 5) {
                this.cursorRelativePos.x = (event.canvasX / this.canvas.width) * 2 - 1
                this.cursorRelativePos.y = -(event.canvasY / this.canvas.height) * 2 + 1
                if (this.sceneMgr.hasBuildModeSelection()) {
                    this.sceneMgr.setBuildModeSelection(null)
                } else if (this.entityMgr.selection.doubleSelect) {
                    console.warn('Double selection handling not yet implemented') // TODO Implement laser shooting
                } else if (this.entityMgr.selection.raiders.length > 0 || this.entityMgr.selection.vehicles.length > 0) {
                    const cursorTarget = new SelectionRaycaster(this.worldMgr).getFirstCursorTarget(this.cursorRelativePos)
                    if (cursorTarget.vehicle) {
                        const selectedRaiders = this.entityMgr.selection.raiders
                        if (selectedRaiders.length > 0 && !cursorTarget.vehicle.driver) {
                            const manVehicleJob = new ManVehicleJob(cursorTarget.vehicle)
                            selectedRaiders.some((r) => {
                                if (r.hasTraining(manVehicleJob.requiredTraining)) {
                                    r.setJob(manVehicleJob)
                                } else {
                                    const requiredTraining = manVehicleJob.requiredTraining
                                    const closestTrainingSite = r.findShortestPath(this.entityMgr.getTrainingSiteTargets(requiredTraining))
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
                        this.entityMgr.selection.assignCarryJob(cursorTarget.material)
                        if (!this.entityMgr.selection.isEmpty()) EventBroker.publish(new DeselectAll())
                    } else if (cursorTarget.surface) {
                        if (this.entityMgr.selection.canDrill(cursorTarget.surface)) {
                            const drillJob = cursorTarget.surface.setupDrillJob()
                            this.entityMgr.selection.assignSurfaceJob(drillJob)
                        } else if (this.entityMgr.selection.canClear() && cursorTarget.surface.hasRubble()) {
                            const clearJob = cursorTarget.surface.setupClearRubbleJob()
                            this.entityMgr.selection.assignSurfaceJob(clearJob)
                        } else if (this.entityMgr.selection.canMove()) {
                            if (cursorTarget.surface.isWalkable()) {
                                this.entityMgr.selection.raiders.forEach((r) => r.setJob(new MoveJob(r, cursorTarget.surface.getRandomPosition())))
                            }
                            this.entityMgr.selection.vehicles.forEach((v) => v.setJob(new MoveJob(v, cursorTarget.surface.getCenterWorld2D())))
                        } else {
                            console.warn('Unexpected surface target given', cursorTarget)
                        }
                        if (!this.entityMgr.selection.isEmpty()) EventBroker.publish(new DeselectAll())
                    } else if (cursorTarget.raider || cursorTarget.building) {
                        const selection = new GameSelection()
                        if (cursorTarget.raider) selection.raiders.push(cursorTarget.raider)
                        selection.building = cursorTarget.building
                        this.worldMgr.entityMgr.selection.set(selection)
                        EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
                    } else {
                        console.warn('Unexpected cursor target given', cursorTarget)
                    }
                } else {
                    const x = (this.pointerDown.x + event.canvasX) / this.canvas.width - 1
                    const y = -(this.pointerDown.y + event.canvasY) / this.canvas.height + 1
                    const selection = new SelectionRaycaster(this.worldMgr).getSelectionByRay(new Vector2(x, y))
                    this.worldMgr.entityMgr.selection.set(selection)
                    EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
                }
            } else if (event.pointerType === 'mouse') {
                const r1x = (this.pointerDown.x / this.canvas.width) * 2 - 1
                const r1y = -(this.pointerDown.y / this.canvas.height) * 2 + 1
                const r2x = (event.canvasX / this.canvas.width) * 2 - 1
                const r2y = -(event.canvasY / this.canvas.height) * 2 + 1
                const selection = this.worldMgr.sceneMgr.getEntitiesInFrustum(r1x, r1y, r2x, r2y)
                this.worldMgr.entityMgr.selection.set(selection)
                EventBroker.publish(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
            }
            this.pointerDown = null
            EventBroker.publish(new SelectionFrameChangeEvent(null))
        }
    }

    handleKeyUpEvent(event: GameKeyboardEvent): boolean {
        if (event.key === ' ') {
            GameState.showObjInfo = !GameState.showObjInfo
            this.entityMgr.raiders.forEach((r) => {
                const infoComponent = r.worldMgr.ecs.getComponents(r.entity).get(RaiderInfoComponent)
                infoComponent.bubbleSprite.updateVisibleState()
                infoComponent.hungerSprite.visible = GameState.showObjInfo
            })
            return true
        } else if (DEV_MODE && this.entityMgr.selection.surface) {
            if (event.key === 'c') {
                this.entityMgr.selection.surface.collapse()
                EventBroker.publish(new DeselectAll())
                return true
            } else if (event.key === 'f') {
                const surface = this.entityMgr.selection.surface
                if (!surface.surfaceType.floor) {
                    this.sceneMgr.terrain.createFallIn(surface, this.sceneMgr.terrain.findFallInTarget(surface))
                }
                EventBroker.publish(new DeselectAll())
                return true
            }
        }
        return false
    }

    takeScreenshotFromLayer(): Promise<HTMLCanvasElement> {
        return new Promise<HTMLCanvasElement>((resolve) => {
            this.sceneMgr.renderer.screenshotCallback = resolve
        })
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.sceneMgr?.resize(width, height)
    }

    determineCursor(cursorTarget: CursorTarget): Cursor {
        if (this.sceneMgr.hasBuildModeSelection()) {
            return this.sceneMgr.buildMarker.lastCheck ? Cursor.CAN_BUILD : Cursor.CANNOT_BUILD
        }
        if (cursorTarget.raider) return Cursor.SELECTED
        if (cursorTarget.vehicle) {
            if (!cursorTarget.vehicle.driver && this.entityMgr.selection.raiders.length > 0) {
                return Cursor.GETIN
            }
            return Cursor.SELECTED
        }
        if (cursorTarget.building) return Cursor.SELECTED
        if (cursorTarget.material) return this.determineMaterialCursor(cursorTarget.material)
        if (cursorTarget.surface) return this.determineSurfaceCursor(cursorTarget.surface)
        return Cursor.STANDARD
    }

    private determineMaterialCursor(material: MaterialEntity): Cursor {
        if (this.entityMgr.selection.canPickup()) {
            if (material.entityType === EntityType.ORE) {
                return Cursor.PICK_UP_ORE
            } else {
                return Cursor.PICK_UP
            }
        }
        return Cursor.SELECTED
    }

    private determineSurfaceCursor(surface: Surface): Cursor {
        if (this.entityMgr.selection.canMove()) {
            if (surface.surfaceType.digable) {
                if (this.entityMgr.selection.canDrill(surface)) {
                    return Cursor.DRILL
                }
            } else if (surface.surfaceType.floor) {
                if (surface.hasRubble() && this.entityMgr.selection.canClear()) {
                    return Cursor.CLEAR
                }
                return Cursor.MAN_GO
            }
        }
        return surface.surfaceType.cursor
    }
}
