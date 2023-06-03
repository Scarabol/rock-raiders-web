import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneEntity } from '../../../scene/SceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../../terrain/Surface'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Selectable } from '../Selectable'
import { MaterialEntity } from './MaterialEntity'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { Object3D } from 'three'

export class ElectricFence extends MaterialEntity implements Selectable {
    readonly selectionFrameParent: Object3D
    selected: boolean = false
    inBeam: boolean = false

    constructor(worldMgr: WorldManager, readonly targetSurface: Surface) {
        super(worldMgr, EntityType.ELECTRIC_FENCE, PriorityIdentifier.CONSTRUCTION, RaiderTraining.NONE)
        this.sceneEntity = new SceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.addToMeshGroup(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.ElectricFence))
        this.selectionFrameParent = this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity.group, {gameEntity: this.entity, entityType: this.entityType}, ResourceManager.configuration.stats.electricFence, ResourceManager.configuration.stats.electricFence.PickSphere / 3)).pickSphere
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
        this.worldMgr.ecs.addComponent(this.entity, new SelectionFrameComponent(this.selectionFrameParent, this.stats))
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
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent).select()
        this.selected = true
        return true
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent).deselect()
        this.selected = false
    }

    beamUp() {
        this.inBeam = true
        this.targetSurface.fence = null
        this.targetSurface.fenceRequested = false
        // TODO stop spawning lightning animations
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        // TODO update defence grid
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.worldMgr.entityMgr.placedFences.remove(this)
    }
}
