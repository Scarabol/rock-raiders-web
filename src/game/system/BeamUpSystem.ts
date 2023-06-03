import { AbstractGameSystem, GameEntity } from '../ECS'
import { BeamUpComponent } from '../component/BeamUpComponent'
import { TILESIZE } from '../../params'

export class BeamUpSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set<Function>([BeamUpComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const beamUpComponent = components.get(BeamUpComponent)
                if (beamUpComponent.entity.sceneEntity.position.y < 4 * TILESIZE) {
                    beamUpComponent.entity.sceneEntity.position.y += 4 * TILESIZE / 122 * elapsedMs * 25 / 1000
                } else {
                    beamUpComponent.entity.disposeFromWorld()
                    this.ecs.worldMgr.entityMgr.removeEntity(entity, beamUpComponent.entity.entityType)
                    this.ecs.removeEntity(entity)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
