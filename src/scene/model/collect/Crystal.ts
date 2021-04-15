import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { Color, Material, MeshPhongMaterial } from 'three'
import { CollectableEntity, CollectableType } from './CollectableEntity'
import { Building } from '../../../game/model/entity/building/Building'
import { SceneManager } from '../../SceneManager'
import { clearIntervalSafe } from '../../../core/Util'

export class Crystal extends CollectableEntity {

    constructor() {
        super(CollectableType.CRYSTAL)
        const resource2 = ResourceManager.getResource('MiscAnims/Crystal/vlp_greencrystal.lwo')
        const mesh2 = SceneManager.registerMesh(new LWOLoader('MiscAnims/Crystal/').parse(resource2));
        (mesh2.material as Material[]).forEach((mat: MeshPhongMaterial) => {
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.emissive = new Color(0, 255, 0) // XXX should be luminosity color from mesh file?
            mat.depthWrite = false // otherwise transparent parts "carve out" objects behind
            mat.opacity = 0.5 // XXX read from LWO file?
            mat.transparent = true
        })
        mesh2.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
        this.group.add(mesh2)
        const resource = ResourceManager.getResource('World/Shared/Crystal.lwo') // highpoly version
        const mesh = SceneManager.registerMesh(new LWOLoader('World/Shared/').parse(resource));
        (mesh.material as Material[]).forEach((mat: MeshPhongMaterial) => {
            mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.transparent = true
            mat.opacity = 0.4 // XXX read from LWO file?
        })
        this.group.add(mesh)
        this.sequenceIntervals.forEach((interval) => clearIntervalSafe(interval)) // TODO looks better without sequence, maybe just slow it down or merge it?
    }

    get stats() {
        return ResourceManager.stats.PowerCrystal
    }

    getTargetBuildingTypes(): Building[] {
        return [Building.POWER_STATION, Building.TOOLSTATION]
    }

    onDiscover() {
        super.onDiscover()
        console.log('An energy crystal has been discovered')
    }

}
