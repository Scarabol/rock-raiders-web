import { AbstractGameSystem } from '../ECS'
import { EventBroker } from '../../event/EventBroker'
import { EventKey } from '../../event/EventKeyEnum'
import { MaterialAmountChanged, MonsterLaserHitEvent, ShootLaserEvent } from '../../event/WorldEvents'
import { Group, Object3D, Raycaster, Vector2, Vector3 } from 'three'
import { WorldManager } from '../WorldManager'
import { LaserBeamTurretComponent } from '../component/LaserBeamTurretComponent'
import { GameState } from '../model/GameState'
import { PositionComponent } from '../component/PositionComponent'
import { EntityType } from '../model/EntityType'
import { MaterialSpawner } from '../factory/MaterialSpawner'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { LaserBeamMesh } from '../../scene/LaserBeamMesh'
import { SurfaceMesh } from '../terrain/SurfaceMesh'
import { PickSphereMesh, SceneSelectionComponent } from '../component/SceneSelectionComponent'
import { GameConfig } from '../../cfg/GameConfig'
import { PRNG } from '../factory/PRNG'

class LaserShot {
    timeout: number = 250

    constructor(readonly group: Group) {
    }
}

export class LaserShotSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([LaserBeamTurretComponent])
    readonly raycaster: Raycaster = new Raycaster()
    readonly laserShots: LaserShot[] = []

    constructor(readonly worldMgr: WorldManager) {
        super()
        EventBroker.subscribe(EventKey.SHOOT_LASER, (event: ShootLaserEvent) => {
            this.onShootLaser(event)
        })
    }

    private onShootLaser(event: ShootLaserEvent) {
        if (GameState.numCrystal < 1) return
        const components = this.worldMgr.ecs.getComponents(event.entity)
        const turretComponent = components.get(LaserBeamTurretComponent)
        if (turretComponent.fireDelay > 0) return
        const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
        const positionComponent = components.get(PositionComponent)
        if (!turretComponent || !sceneEntityComponent || !positionComponent) return
        GameState.dischargedCrystals += turretComponent.weaponCfg.dischargeRate
        if (GameState.dischargedCrystals >= 1) {
            this.spawnDepletedEnergyCrystal(positionComponent)
        }
        turretComponent.fireDelay = turretComponent.weaponCfg.rechargeTimeMs
        sceneEntityComponent.sceneEntity.getFireNullParents().forEach((parent) => {
            this.worldMgr.sceneMgr.addPositionalAudio(sceneEntityComponent.sceneEntity, 'SFX_Laser', false)
            this.addLaserShot(parent, turretComponent)
        })
    }

    private spawnDepletedEnergyCrystal(positionComponent: PositionComponent) {
        GameState.dischargedCrystals--
        GameState.numCrystal--
        EventBroker.publish(new MaterialAmountChanged())
        const closestToolstore = this.worldMgr.entityMgr.getClosestBuildingByType(positionComponent.position, EntityType.TOOLSTATION)
        let spawnPos: Vector2 | undefined
        if (closestToolstore) {
            spawnPos = closestToolstore.getDropPosition2D()
        } else if (positionComponent.surface.isWalkable()) {
            spawnPos = positionComponent.surface.getRandomPosition()
        } else {
            const walkableNeighbor = positionComponent.surface.neighbors.find((n) => n.isWalkable())
            if (walkableNeighbor) spawnPos = walkableNeighbor.getRandomPosition()
        }
        if (spawnPos) MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.DEPLETED_CRYSTAL, spawnPos)
    }

    private addLaserShot(parent: { worldPos: Vector3; worldDirection: Vector3 }, turretComponent: LaserBeamTurretComponent) {
        this.raycaster.set(parent.worldPos, parent.worldDirection)
        this.raycaster.far = turretComponent.weaponCfg.weaponRange
        let beamLength = turretComponent.weaponCfg.weaponRange
        // TODO Check laser beam shot collision with buildings and vehicles
        const rockyPickSpheres = this.worldMgr.entityMgr.rockMonsters
            .map((r) => this.ecs.getComponents(r)?.get(SceneSelectionComponent)?.pickSphere).filter((m) => !!m)
        const rockyIntersection = this.raycaster.intersectObjects<PickSphereMesh>(rockyPickSpheres, false)[0]
        if (rockyIntersection) {
            beamLength = rockyIntersection.distance
            const rocky = rockyIntersection.object.userData.gameEntity
            EventBroker.publish(new MonsterLaserHitEvent(rocky, turretComponent.weaponCfg))
            const soundParent = new Object3D()
            soundParent.position.copy(rockyIntersection.point)
            this.worldMgr.sceneMgr.addPositionalAudio(soundParent, 'SFX_LaserHit', false)
            this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.BoulderExplode, rockyIntersection.point, PRNG.animation.random() * 2 * Math.PI, false)
        } else {
            const floorIntersection = this.raycaster.intersectObjects<SurfaceMesh>(this.worldMgr.sceneMgr.floorGroup.children, false)[0]
            if (floorIntersection) {
                beamLength = floorIntersection.distance
                const surface = floorIntersection.object.userData.selectable
                if (surface?.surfaceType.statsLaserName) {
                    const laserDestroyTime = turretComponent.weaponCfg[surface.surfaceType.statsLaserName]
                    if (laserDestroyTime) {
                        // XXX original game needs 13 shots with double or 27 with single laser turret to collapse medium wall
                        const laserProgress = Math.min(1 / (laserDestroyTime / 50), 1)
                        surface.addDrillProgress(laserProgress, new Vector2()) // XXX Actually drill pos parameter not needed for not-seam walls?
                    }
                }
                const soundParent = new Object3D()
                soundParent.position.copy(floorIntersection.point)
                this.worldMgr.sceneMgr.addPositionalAudio(soundParent, 'SFX_LaserHit', false)
                this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.BoulderExplode, floorIntersection.point, PRNG.animation.random() * 2 * Math.PI, false)
            } // else { // XXX Stop laser shot beam at roof intersection
        }
        const mesh = new LaserBeamMesh(beamLength)
        mesh.position.copy(parent.worldPos)
        mesh.lookAt(parent.worldPos.clone().add(parent.worldDirection))
        this.laserShots.add(new LaserShot(mesh))
        this.worldMgr.sceneMgr.scene.add(mesh)
        const soundParent = new Object3D()
        soundParent.position.copy(parent.worldPos)
        this.worldMgr.sceneMgr.addPositionalAudio(soundParent, 'SFX_LazerRecharge', false)
    }

    update(elapsedMs: number, entities: Set<number>, dirty: Set<number>): void {
        const currentShots = [...this.laserShots]
        this.laserShots.length = 0
        currentShots.forEach((s) => {
            if (s.timeout > 0) {
                s.timeout -= elapsedMs
                this.laserShots.add(s)
            } else {
                this.worldMgr.sceneMgr.scene.remove(s.group)
            }
        })
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const turretComponent = components.get(LaserBeamTurretComponent)
                if (turretComponent.fireDelay > 0) {
                    turretComponent.fireDelay -= elapsedMs
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
