import { AdditiveBlending, Color, Material, MeshPhongMaterial } from 'three'
import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { Building } from '../building/Building'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CollectableEntity } from './CollectableEntity'
import { CollectableType } from './CollectableType'

export class Crystal extends CollectableEntity {

    constructor() {
        super(CollectableType.CRYSTAL)
        const resource2 = ResourceManager.getResource('MiscAnims/Crystal/vlp_greencrystal.lwo')
        const mesh2 = SceneManager.registerMesh(new LWOLoader('MiscAnims/Crystal/').parse(resource2));
        (mesh2.material as Material[]).forEach((mat: MeshPhongMaterial) => {
            mat.blending = AdditiveBlending
            mat.depthWrite = false // otherwise transparent parts "carve out" objects behind
            mat.opacity = 0.5 // XXX read from LWO file?
            mat.transparent = mat.opacity < 1
        })
        mesh2.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
        this.group.add(mesh2)
        const resource = ResourceManager.getResource('World/Shared/Crystal.lwo') // highpoly version
        const mesh = SceneManager.registerMesh(new LWOLoader('World/Shared/').parse(resource));
        (mesh.material as Material[]).forEach((mat: MeshPhongMaterial) => {
            mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.opacity = 0.4 // XXX read from LWO file?
            mat.transparent = mat.opacity < 1
        })
        this.group.add(mesh)
        this.targetBuildingTypes = [Building.POWER_STATION, Building.TOOLSTATION]
        this.priorityIdentifier = PriorityIdentifier.aiPriorityCrystal
    }

    get stats() {
        return ResourceManager.stats.PowerCrystal
    }

}
