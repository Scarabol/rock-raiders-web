import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { BeamUpComponent } from '../component/BeamUpComponent'
import { TILESIZE } from '../../params'
import { WorldManager } from '../WorldManager'

export class BeamUpSystem extends AbstractGameSystem {
    readonly inBeam: FilteredEntities = this.addEntityFilter(BeamUpComponent)

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(ecs: ECS, elapsedMs: number): void {
        for (const [entity, components] of this.inBeam) {
            try {
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
