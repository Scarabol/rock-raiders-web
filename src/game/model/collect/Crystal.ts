import { AdditiveBlending, Color } from 'three'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SequenceTextureMaterial } from '../../../scene/SequenceTextureMaterial'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Crystal extends MaterialEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.CRYSTAL)
        const mesh2 = ResourceManager.getLwoModel('MiscAnims/Crystal/vlp_greencrystal.lwo')
        mesh2.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.blending = AdditiveBlending
            mat.depthWrite = false // otherwise transparent parts "carve out" objects behind
            mat.setOpacity(0.5) // XXX read from LWO file?
        })
        mesh2.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
        this.group.add(mesh2)
        const mesh = ResourceManager.getLwoModel('World/Shared/Crystal.lwo') // high poly version
        mesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.setOpacity(0.9) // XXX read from LWO file?
        })
        this.group.add(mesh)
        this.targetBuildingTypes = [EntityType.POWER_STATION, EntityType.TOOLSTATION]
        this.priorityIdentifier = PriorityIdentifier.aiPriorityCrystal
    }

    get stats() {
        return ResourceManager.stats.PowerCrystal
    }

}
