import { AdditiveBlending, Color } from 'three'
import { SceneManager } from '../../game/SceneManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneEntity } from '../SceneEntity'
import { SceneMesh } from '../SceneMesh'
import { SequenceTextureMaterial } from '../SequenceTextureMaterial'

export class CrystalSceneEntity extends SceneEntity {
    animGlowMesh: SceneMesh
    highPolyMesh: SceneMesh

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr)
        this.animGlowMesh = ResourceManager.getLwoModel('MiscAnims/Crystal/vlp_greencrystal.lwo')
        this.animGlowMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.blending = AdditiveBlending
            mat.depthWrite = false // otherwise, transparent parts "carve out" objects behind
            mat.setOpacity(0.5) // XXX read from LWO file?
        })
        this.animGlowMesh.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
        this.add(this.animGlowMesh)
        this.highPolyMesh = ResourceManager.getLwoModel('World/Shared/Crystal.lwo') // high poly version
        this.highPolyMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.setOpacity(0.9) // XXX read from LWO file?
        })
        this.add(this.highPolyMesh)
        this.addPickSphere(ResourceManager.configuration.stats.PowerCrystal.PickSphere)
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        this.animGlowMesh.update(elapsedMs)
        this.highPolyMesh.update(elapsedMs)
    }
}
