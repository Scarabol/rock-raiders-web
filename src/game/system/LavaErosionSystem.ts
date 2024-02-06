import { AbstractGameSystem, GameEntity } from '../ECS'
import { LavaErosionComponent } from '../component/LavaErosionComponent'
import { SurfaceType } from '../terrain/SurfaceType'
import { EventKey } from '../../event/EventKeyEnum'
import { LevelSelectedEvent } from '../../event/WorldEvents'
import { EventBroker } from '../../event/EventBroker'

export class LavaErosionSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([LavaErosionComponent])
    erodeTriggerTimeMs: number = 0
    increaseErosionDelayMs: number = 0
    erosionStartDelayTimeMs: number = 0

    static readonly erodibleSurfaceTypes: SurfaceType[] = [
        SurfaceType.GROUND, SurfaceType.POWER_PATH, SurfaceType.POWER_PATH_BUILDING_SITE,
        SurfaceType.LAVA1, SurfaceType.LAVA2, SurfaceType.LAVA3, SurfaceType.LAVA4,
        SurfaceType.RUBBLE1, SurfaceType.RUBBLE2, SurfaceType.RUBBLE3, SurfaceType.RUBBLE4,
    ]

    constructor() {
        super()
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, (levelSelectedEvent: LevelSelectedEvent) => {
            this.erodeTriggerTimeMs = levelSelectedEvent.levelConf.erodeTriggerTime * 1000
            this.increaseErosionDelayMs = levelSelectedEvent.levelConf.erodeErodeTime * 1000
            this.erosionStartDelayTimeMs = levelSelectedEvent.levelConf.erodeLockTime * 1000
        })
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const erosionComponent = components.get(LavaErosionComponent)
                if (erosionComponent.surface.surfaceType === SurfaceType.LAVA5) {
                    this.ecs.removeComponent(entity, LavaErosionComponent)
                    continue
                } else if (!erosionComponent.surface.discovered) {
                    continue
                } else if (!LavaErosionSystem.erodibleSurfaceTypes.includes(erosionComponent.surface.surfaceType)) {
                    continue
                } else if (!erosionComponent.isSelfEroding && !erosionComponent.surface.neighbors.some((s) => s.surfaceType === SurfaceType.LAVA5)) {
                    continue
                }
                erosionComponent.erosionTimer += elapsedMs
                while (erosionComponent.erosionTimer > this.increaseErosionDelayMs + (erosionComponent.surface.surfaceType.hasErosion ? 0 : this.erosionStartDelayTimeMs)) {
                    erosionComponent.increaseErosionLevel()
                    erosionComponent.erosionTimer -= this.increaseErosionDelayMs
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
