import { AbstractGameSystem, GameEntity } from '../ECS'
import { NATIVE_UPDATE_INTERVAL } from '../../params'
import { PositionComponent } from '../component/PositionComponent'
import { FlockComponent } from '../component/FlockComponent'
import { Quaternion, Vector3 } from 'three'

function clamp(value: number, min:number, max:number): number {
    return Math.max(min, Math.min(max, value))
}

export class FlockBehaviorSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([PositionComponent, FlockComponent])

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        const frameMult = elapsedMs / NATIVE_UPDATE_INTERVAL
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const positionComponent = components.get(PositionComponent)
                if (!positionComponent.isDiscovered()) continue
                const flockComponent = components.get(FlockComponent)

                const targetPosition = positionComponent.position.clone()
                targetPosition.y += positionComponent.floorOffset
                const flockEntities = flockComponent.entities.map((e) => ({
                    ...e,
                    pos: e.sceneEntity.position.clone(),
                    rot: new Quaternion().setFromEuler(e.sceneEntity.rotation),
                    dir: new Vector3(0,0,1).applyEuler(e.sceneEntity.rotation),
                }))
                let avgDir = new Vector3()
                flockEntities.forEach((e) => avgDir.add(e.dir))
                avgDir.normalize()

                for (const flockEntity of flockEntities) {
                    let minDist: Vector3;
                    flockEntities.forEach((e) => {
                        if (Object.is(e.sceneEntity, flockEntity.sceneEntity)) return
                        const dist = e.pos.clone().sub(flockEntity.pos)
                        if (!minDist || minDist.lengthSq() > dist.lengthSq())
                            minDist = dist
                    })

                    let newDir = new Vector3()
                    if (minDist) {
                        const minDistLength = minDist.length()
                        let evasionDir = new Vector3()
                        if (minDistLength === 0) {
                            evasionDir.randomDirection()
                        } else {
                            evasionDir.copy(minDist).multiplyScalar(-1 / minDistLength)
                        }
                        newDir.addScaledVector(evasionDir,
                            clamp(1 - minDistLength/flockEntity.separationDist, 0, 1) * flockEntity.separationMult)
                    }
                    newDir.addScaledVector(flockEntity.dir, flockEntity.intertiaMult / frameMult)
                    newDir.addScaledVector(avgDir, flockEntity.alignmentMult)
                    const targetDist = targetPosition.clone().sub(flockEntity.pos)
                    const targetDistLength = targetDist.length()
                    if (targetDistLength !== 0) {
                        const targetDir = targetDist.clone().multiplyScalar(1 / targetDistLength)
                        newDir.addScaledVector(targetDir,
                            clamp(targetDistLength / flockEntity.cohesionDist, 0, 1) * flockEntity.cohesionMult)
                    }
                    newDir.normalize()

                    const newPos = flockEntity.sceneEntity.position.clone().addScaledVector(newDir, flockEntity.speed * frameMult)
                    flockEntity.sceneEntity.lookAt(newPos)
                    flockEntity.sceneEntity.position.copy(newPos)
                    flockEntity.sceneEntity.visible = true
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
