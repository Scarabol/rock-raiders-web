import { AdditiveBlending, Color } from 'three'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneEntity } from '../../../scene/SceneEntity'
import { SequenceTextureMaterial } from '../../../scene/SequenceTextureMaterial'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'
import { GameState } from "../GameState"
import { EventBus } from "../../../event/EventBus"
import { MaterialAmountChanged } from "../../../event/WorldEvents"

export class Crystal extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.CRYSTAL, PriorityIdentifier.CRYSTAL, RaiderTraining.NONE)
        this.sceneEntity = new SceneEntity(this.worldMgr.sceneMgr)
        const animGlowMesh = ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Crystal)
        animGlowMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.blending = AdditiveBlending
            mat.depthWrite = false // otherwise, transparent parts "carve out" objects behind
            mat.setOpacity(0.5) // XXX read from LWO file?
        })
        animGlowMesh.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
        this.sceneEntity.addUpdatable(animGlowMesh)
        const highPolyMesh = ResourceManager.getLwoModel('World/Shared/Crystal') // high poly version
        highPolyMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
            mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
            mat.color = new Color(0, 0, 0) // XXX read from LWO file?
            mat.setOpacity(0.9) // XXX read from LWO file?
        })
        this.sceneEntity.addUpdatable(highPolyMesh)
        this.sceneEntity.addPickSphere(ResourceManager.configuration.stats.powerCrystal.PickSphere)
        this.sceneEntity.pickSphere.userData = {entityType: this.entityType, materialEntity: this}
    }

    findCarryTargets(): PathTarget[] {
        const sites = this.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
        const powerStations = this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.POWER_STATION)
        if (powerStations.length > 0) return powerStations
        return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }

    onDeposit() {
        super.onDeposit()
        GameState.numCrystal++
        EventBus.publishEvent(new MaterialAmountChanged())
    }
}
