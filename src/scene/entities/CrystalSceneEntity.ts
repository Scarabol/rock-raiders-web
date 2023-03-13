import { AdditiveBlending, Color } from 'three'
import { SceneManager } from '../../game/SceneManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneEntity } from '../SceneEntity'
import { SequenceTextureMaterial } from '../SequenceTextureMaterial'

export class CrystalSceneEntity extends SceneEntity {
    constructor(sceneMgr: SceneManager) {
        super(sceneMgr)
        const animGlowMesh = ResourceManager.getLwoModel('MiscAnims/Crystal/vlp_greencrystal.lwo')
        animGlowMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.blending = AdditiveBlending
            mat.depthWrite = false // otherwise, transparent parts "carve out" objects behind
            mat.setOpacity(0.5) // XXX read from LWO file?
        })
        animGlowMesh.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
        this.addUpdatable(animGlowMesh)
        const highPolyMesh = ResourceManager.getLwoModel('World/Shared/Crystal.lwo') // high poly version
        highPolyMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.setOpacity(0.9) // XXX read from LWO file?
        })
        this.addUpdatable(highPolyMesh)
        this.addPickSphere(ResourceManager.configuration.stats.powerCrystal.PickSphere)
    }
}
