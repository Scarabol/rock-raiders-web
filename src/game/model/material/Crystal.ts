import { AdditiveBlending, Color } from 'three'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneEntity } from '../../../scene/SceneEntity'
import { SequenceTextureMaterial } from '../../../scene/SequenceTextureMaterial'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'

export class Crystal extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.CRYSTAL, PriorityIdentifier.CRYSTAL, RaiderTraining.NONE, null)
        this.sceneEntity = new SceneEntity(this.worldMgr.sceneMgr)
        const animGlowMesh = ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Crystal)
        animGlowMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.blending = AdditiveBlending
            mat.depthWrite = false // otherwise, transparent parts "carve out" objects behind
            mat.setOpacity(0.5) // XXX read from LWO file?
        })
        animGlowMesh.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
        this.sceneEntity.addUpdatable(animGlowMesh)
        const highPolyMesh = ResourceManager.getLwoModel('World/Shared/Crystal') // high poly version
        highPolyMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.setOpacity(0.9) // XXX read from LWO file?
        })
        this.sceneEntity.addUpdatable(highPolyMesh)
        this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity.group, {gameEntity: this.entity, entityType: this.entityType}, ResourceManager.configuration.stats.powerCrystal))
    }
}
