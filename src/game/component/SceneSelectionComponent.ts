import { AbstractGameComponent, GameEntity } from '../ECS'
import { PickSphereStats } from '../../cfg/GameStatsCfg'
import { Box3, Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3 } from 'three'
import { EntityType } from '../model/EntityType'

export interface SceneSelectionUserData {
    gameEntity: GameEntity
    entityType: EntityType
}

export class SceneSelectionComponent extends AbstractGameComponent {
    readonly pickSphere: Mesh

    constructor(parentObj: Object3D, userData: SceneSelectionUserData, stats: PickSphereStats, pickSphereHeightOffset: number = null) {
        super()
        const pickSphereRadius = stats.PickSphere / 2
        const geometry = new SphereGeometry(pickSphereRadius, pickSphereRadius, pickSphereRadius)
        const material = new MeshBasicMaterial({color: 0xa0a000, visible: false, wireframe: true}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        const boundingSphereCenter = new Vector3()
        new Box3().setFromObject(parentObj).getCenter(boundingSphereCenter)
        this.pickSphere.position.y = pickSphereHeightOffset ?? boundingSphereCenter.y / 2
        this.pickSphere.userData = userData
        parentObj.add(this.pickSphere)
    }
}
