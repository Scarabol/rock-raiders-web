import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneEntity } from '../../../scene/SceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../../terrain/Surface'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Selectable } from '../Selectable'
import { MaterialEntity } from './MaterialEntity'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { Object3D } from 'three'

export class ElectricFence extends MaterialEntity implements Selectable {
    readonly selectionFrameParent: Object3D

    get selected(): boolean {
        return this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.isSelected()
    }

    constructor(worldMgr: WorldManager, targetSurface: Surface) {
        super(worldMgr, EntityType.ELECTRIC_FENCE, PriorityIdentifier.CONSTRUCTION, RaiderTraining.NONE, targetSurface)
        this.sceneEntity = new SceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.addToMeshGroup(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.ElectricFence))
        this.selectionFrameParent = this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity.group, {gameEntity: this.entity, entityType: this.entityType}, ResourceManager.configuration.stats.electricFence, ResourceManager.configuration.stats.electricFence.PickSphere / 3)).pickSphere
    }

    isSelectable(): boolean {
        return !this.selected && this.worldMgr.ecs.getComponents(this.entity).has(SelectionFrameComponent) && this.targetSurface.fence === this.entity
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.select()
        return true
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }
}
