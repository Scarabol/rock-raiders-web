import { AbstractGameComponent, GameEntity } from '../ECS'
import { PickSphereStats } from '../../cfg/GameStatsCfg'
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { EntityType } from '../model/EntityType'

export interface SceneSelectionUserData {
    gameEntity: GameEntity
    entityType: EntityType
}

export class SceneSelectionComponent extends AbstractGameComponent {
    readonly pickSphere: Mesh

    constructor(parentObj: Object3D, userData: SceneSelectionUserData, readonly stats: PickSphereStats) {
        super()
        const pickSphereRadius = stats.PickSphere / 2 // TODO separate pick spheres from collision and use CollRadius
        const geometry = new SphereGeometry(pickSphereRadius, 8, 8)
        const material = new MeshBasicMaterial({color: 0xa0a000, visible: false, wireframe: true}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        this.pickSphere.position.y = stats.CollHeight / 2
        this.pickSphere.userData = userData
        parentObj.add(this.pickSphere)
    }
}
