import { AbstractGameSystem, GameEntity } from '../ECS'
import { LavaErosionComponent } from '../component/LavaErosionComponent'
import { SurfaceType } from '../terrain/SurfaceType'
import { EventKey } from '../../event/EventKeyEnum'
import { LevelSelectedEvent } from '../../event/WorldEvents'
import { EventBroker } from '../../event/EventBroker'

/**
 * Only one new surface erodes at a time,
 * but multiple surfaces with erosion can progress
 * then their progress appears grouped
 *
 * In Level10 (120, 20, 500) a surface with erosion map value 7 progress each 48 seconds, and new took 45 seconds
 * In Level10 (120, 20, 500) a surface with erosion map value 9 progress each 25 seconds, but new take 45 seconds
 *
 * In Level18 (120, 30, 600) a surface with erosion map value 2 progress each 25 seconds
 * In Level18 (120, 30, 600) a surface with erosion map value 6 progress each 37 seconds
 *
 * In Level21 ( 60,  7, 300) a surface with erosion map value 5 progress each 25 seconds
 *
 * In Level22 ( 20, 40, 300) a surface with erosion map value 5 progress each 20 seconds
 *
 * In Level24 ( 40,  5, 300) a surface with erosion map value 9 progress each  6 seconds, but new take 20 seconds
 */
export class LavaErosionSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([LavaErosionComponent])
    erodeTriggerTimeMs: number = 0
    increaseErosionDelayMs: number = 0
    powerPathLockTimeMs: number = 0
    triggerNewErosionTimer: number = 0

    static readonly erodibleSurfaceTypes: SurfaceType[] = [
        SurfaceType.GROUND, SurfaceType.POWER_PATH, SurfaceType.POWER_PATH_BUILDING_SITE,
        SurfaceType.LAVA1, SurfaceType.LAVA2, SurfaceType.LAVA3, SurfaceType.LAVA4,
        SurfaceType.RUBBLE1, SurfaceType.RUBBLE2, SurfaceType.RUBBLE3, SurfaceType.RUBBLE4,
    ]

    constructor() {
        super()
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, (levelSelectedEvent: LevelSelectedEvent) => {
            this.erodeTriggerTimeMs = levelSelectedEvent.levelConf.erodeTriggerTimeMs
            this.increaseErosionDelayMs = levelSelectedEvent.levelConf.erodeErodeTimeMs
            this.powerPathLockTimeMs = levelSelectedEvent.levelConf.erodeLockTimeMs
            this.triggerNewErosionTimer = 0
        })
    }

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        this.triggerNewErosionTimer += elapsedMs
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const erosionComponent = components.get(LavaErosionComponent)
                if (erosionComponent.surface.surfaceType === SurfaceType.LAVA5) {
                    this.ecs.removeComponent(entity, LavaErosionComponent)
                } else if (erosionComponent.surface.discovered && LavaErosionSystem.erodibleSurfaceTypes.includes(erosionComponent.surface.surfaceType)) {
                    if (erosionComponent.surface.surfaceType.hasErosion) {
                        erosionComponent.erosionTimer += elapsedMs
                        const erosionDelayMs = erosionComponent.erosionTimeMultiplier * this.increaseErosionDelayMs
                        if (erosionComponent.erosionTimer > erosionDelayMs) {
                            erosionComponent.erosionTimer -= erosionDelayMs
                            erosionComponent.increaseErosionLevel(true)
                        }
                    } else if (this.triggerNewErosionTimer > (this.erodeTriggerTimeMs + (erosionComponent.surface.isPath() ? this.powerPathLockTimeMs : 0)) && erosionComponent.canStartNewErosion()) {
                        this.triggerNewErosionTimer -= this.erodeTriggerTimeMs
                        erosionComponent.increaseErosionLevel(true)
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
