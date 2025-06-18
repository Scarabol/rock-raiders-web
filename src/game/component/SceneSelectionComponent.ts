import { AbstractGameComponent, GameEntity } from '../ECS'
import { PickSphereStats } from '../../cfg/GameStatsCfg'
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { EntityType } from '../model/EntityType'

export interface SceneSelectionUserData {
    gameEntity: GameEntity
    entityType: EntityType
}

export class PickSphereMesh extends Mesh<SphereGeometry, MeshBasicMaterial> {
    declare userData: SceneSelectionUserData
}

export class SceneSelectionComponent extends AbstractGameComponent {
    readonly pickSphere: PickSphereMesh

    constructor(parentObj: Object3D, userData: SceneSelectionUserData, readonly stats: PickSphereStats) {
        super()
        const pickSphereRadius = stats.pickSphere / 2 // TODO separate pick spheres from collision and use CollRadius
        const geometry = new SphereGeometry(pickSphereRadius, 8, 8)
        const material = new MeshBasicMaterial({color: 0xa0a000, visible: false, wireframe: true}) // change visible to true for debugging
        this.pickSphere = new PickSphereMesh(geometry, material)
        this.pickSphere.position.y = stats.collHeight / 2
        this.pickSphere.userData = userData
        parentObj.add(this.pickSphere)
    }
}
