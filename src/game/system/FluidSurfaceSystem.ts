import { AbstractGameSystem, GameEntity } from '../ECS'
import { FluidSurfaceComponent } from '../component/FluidSurfaceComponent'

export class FluidSurfaceSystem extends AbstractGameSystem {
    private static readonly firstIndexGroup = [0, 2, 3, 4]

    readonly componentsRequired: Set<Function> = new Set([FluidSurfaceComponent])
    progress: number = 0

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        this.progress = (this.progress + Math.PI * elapsedMs / 2500) % (2 * Math.PI)
        const wave = Math.sin(this.progress) * 0.08
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const fluidComponent = components.get(FluidSurfaceComponent)
                for (let index = 0; index < 6; index++) {
                    const indexToLoc = FluidSurfaceSystem.firstIndexGroup.includes(index) === fluidComponent.xToY
                    const waveX = indexToLoc ? wave : 0
                    const waveY = indexToLoc ? 0 : wave * 0.75
                    fluidComponent.uvAttribute.setXY(index, fluidComponent.u[index] + waveX, fluidComponent.v[index] + waveY)
                    fluidComponent.uvAttribute.needsUpdate = true
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
