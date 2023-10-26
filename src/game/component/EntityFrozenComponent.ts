import { AbstractGameComponent } from '../ECS'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { WorldManager } from '../WorldManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { Vector3 } from 'three'

export class EntityFrozenComponent extends AbstractGameComponent {
    readonly iceCubeEntity: AnimatedSceneEntity

    constructor(worldMgr: WorldManager, entity: number, freezerTimeMs: number, position: Vector3, heading: number) {
        super()
        this.iceCubeEntity = new AnimatedSceneEntity(worldMgr.sceneMgr.audioListener)
        this.iceCubeEntity.addAnimated(ResourceManager.getAnimatedData('MiscAnims/IceCube'))
        this.iceCubeEntity.setAnimation('Start', () => {
            this.iceCubeEntity.setAnimation('Normal', () => {
                this.iceCubeEntity.setAnimation('Melt', () => {
                    worldMgr.ecs.removeComponent(entity, EntityFrozenComponent)
                })
            }, freezerTimeMs) // TODO reduce time by start and melt?
        })
        this.iceCubeEntity.position.copy(position)
        this.iceCubeEntity.rotation.y = heading
        worldMgr.sceneMgr.addMeshGroup(this.iceCubeEntity)
    }
}
