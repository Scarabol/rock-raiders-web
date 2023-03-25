import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneEntity } from '../../../scene/SceneEntity'
import { BeamUpAnimator, BeamUpEntity } from '../../BeamUpAnimator'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Selectable } from '../Selectable'
import { MaterialEntity } from './MaterialEntity'

export class ElectricFence extends MaterialEntity implements Selectable, BeamUpEntity {
    selected: boolean = false
    inBeam: boolean = false
    beamUpAnimator: BeamUpAnimator = null

    constructor(worldMgr: WorldManager, readonly targetSurface: Surface) {
        super(worldMgr, EntityType.ELECTRIC_FENCE, PriorityIdentifier.CONSTRUCTION, RaiderTraining.NONE)
        this.sceneEntity = new SceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.addToMeshGroup(ResourceManager.getLwoModel('Buildings/E-Fence/E-Fence4.lwo'))
    }

    get stats() {
        return ResourceManager.configuration.stats.electricFence
    }

    findCarryTargets(): PathTarget[] {
        if (!this.targetSurface.isWalkable()) {
            return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        } else {
            return [PathTarget.fromLocation(this.targetSurface.getCenterWorld2D())]
        }
    }

    onCarryJobComplete(): void {
        super.onCarryJobComplete()
        this.sceneEntity.addToScene(null, null)
        this.sceneEntity.makeSelectable(this, this.stats.PickSphere / 4)
        this.targetSurface.fence = this
        this.targetSurface.fenceRequested = false
        this.worldMgr.entityMgr.placedFences.add(this)
    }

    isSelectable(): boolean {
        return !this.selected && !this.inBeam && this.isPlacedDown()
    }

    private isPlacedDown() {
        return this.targetSurface.fence === this
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.sceneEntity.selectionFrame.visible = true
        this.selected = true
        return true
    }

    deselect() {
        this.sceneEntity.selectionFrame.visible = false
        this.sceneEntity.selectionFrameDouble.visible = false
        this.selected = false
    }

    beamUp() {
        this.inBeam = true
        this.targetSurface.fence = null
        this.targetSurface.fenceRequested = false
        // TODO stop spawning lightning animations
        this.beamUpAnimator = new BeamUpAnimator(this)
        // TODO update defence grid
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        this.beamUpAnimator?.update(elapsedMs)
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.worldMgr.entityMgr.placedFences.remove(this)
    }
}
