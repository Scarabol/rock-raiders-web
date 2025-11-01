import { AbstractGameSystem, ECS, GameEntity } from '../ECS'
import { BeamUpComponent } from '../component/BeamUpComponent'
import { TILESIZE } from '../../params'
import { WorldManager } from '../WorldManager'

export class BeamUpSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set<Function>([BeamUpComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(ecs: ECS, elapsedMs: number, entities: Set<GameEntity>, _dirty: Set<GameEntity>): void {
        for (const entity of entities) {
            try {
                const components = ecs.getComponents(entity)
                const beamUpComponent = components.get(BeamUpComponent)
                const position = beamUpComponent.entity.getPosition()
                if (position.y < 4 * TILESIZE) {
                    position.y += 4 * TILESIZE / 122 * elapsedMs * 25 / 1000
                    beamUpComponent.entity.setPosition(position)
                } else {
                    beamUpComponent.entity.disposeFromWorld()
                    this.worldMgr.entityMgr.removeEntity(entity)
                    ecs.removeEntity(entity)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
