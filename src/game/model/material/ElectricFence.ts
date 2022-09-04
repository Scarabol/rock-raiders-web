import { ResourceManager } from '../../../resource/ResourceManager'
import { ElectricFenceSceneEntity } from '../../../scene/entities/ElectricFenceSceneEntity'
import { BeamUpAnimator, BeamUpEntity } from '../../BeamUpAnimator'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { CarryFenceJob } from '../job/carry/CarryFenceJob'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { Selectable } from '../Selectable'
import { MaterialEntity } from './MaterialEntity'

export class ElectricFence extends MaterialEntity implements Selectable, BeamUpEntity {
    targetSurface: Surface
    target: CarryPathTarget[]
    selected: boolean = false
    inBeam: boolean = false
    beamUpAnimator: BeamUpAnimator = null

    constructor(worldMgr: WorldManager, targetSurface: Surface) {
        super(worldMgr, EntityType.ELECTRIC_FENCE, PriorityIdentifier.CONSTRUCTION)
        this.sceneEntity = new ElectricFenceSceneEntity(this.worldMgr.sceneMgr)
        this.targetSurface = targetSurface
        this.target = [new CarryPathTarget(targetSurface.getCenterWorld2D())]
    }

    get stats() {
        return ResourceManager.configuration.stats.electricFence
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.target.every((t) => t.isInvalid())) {
            return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        } else {
            return this.target
        }
    }

    createCarryJob(): CarryFenceJob {
        return new CarryFenceJob(this)
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
