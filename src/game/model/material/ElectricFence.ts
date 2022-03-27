import { ResourceManager } from '../../../resource/ResourceManager'
import { ElectricFenceSceneEntity } from '../../../scene/entities/ElectricFenceSceneEntity'
import { BeamUpAnimator, BeamUpEntity } from '../../BeamUpAnimator'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
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

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, targetSurface: Surface) {
        super(sceneMgr, entityMgr, EntityType.ELECTRIC_FENCE)
        this.sceneEntity = new ElectricFenceSceneEntity(sceneMgr)
        this.targetSurface = targetSurface
        this.target = [new CarryPathTarget(targetSurface.getCenterWorld2D())]
    }

    get stats() {
        return ResourceManager.configuration.stats.ElectricFence
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.target.every((t) => t.isInvalid())) {
            return this.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        } else {
            return this.target
        }
    }

    createCarryJob(): CarryFenceJob {
        return new CarryFenceJob(this)
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.CONSTRUCTION
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
        this.entityMgr.placedFences.remove(this)
    }
}
