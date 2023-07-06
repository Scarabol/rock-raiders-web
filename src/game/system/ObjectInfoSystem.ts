import { AbstractGameSystem, GameEntity } from '../ECS'
import { RaiderInfoComponent } from '../component/RaiderInfoComponent'
import { GameState } from '../model/GameState'
import { HealthComponent } from '../component/HealthComponent'

export class ObjectInfoSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([RaiderInfoComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const infoComponent = components.get(RaiderInfoComponent)
                if (infoComponent.showDelayMs > 0) infoComponent.showDelayMs -= elapsedMs
                infoComponent.hungerSprite.visible = GameState.showObjInfo
                infoComponent.bubbleSprite.visible = GameState.showObjInfo || infoComponent.showDelayMs > 0
                components.get(HealthComponent)?.setVisible(GameState.showObjInfo)
                // TODO update obj info with raider hunger level and current task/idea
            } catch (e) {
                console.error(e)
            }
        }
    }
}
