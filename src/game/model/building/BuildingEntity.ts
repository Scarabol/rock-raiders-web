import { PositionalAudio, Vector2, Vector3 } from 'three'
import { BuildingEntityStats } from '../../../cfg/BuildingEntityStats'
import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { BuildingsChangedEvent, DeselectAll } from '../../../event/LocalEvents'
import { MaterialAmountChanged } from '../../../event/WorldEvents'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { BeamUpAnimator } from '../../BeamUpAnimator'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BuildingActivity } from '../activities/BuildingActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { GetToolPathTarget } from '../job/raider/GetToolPathTarget'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { Barrier } from '../material/Barrier'
import { BarrierLocation } from '../material/BarrierLocation'
import { Crystal } from '../material/Crystal'
import { ElectricFence } from '../material/ElectricFence'
import { Ore } from '../material/Ore'
import { RaiderTraining, RaiderTrainingSites, RaiderTrainingStatsProperty } from '../raider/RaiderTraining'
import { Selectable } from '../Selectable'
import { BuildingPathTarget } from './BuildingPathTarget'
import { BuildingSite } from './BuildingSite'
import { Teleport } from './Teleport'

export abstract class BuildingEntity implements Selectable {

    blocksPathSurface: boolean = true
    secondaryBuildingPart: Vector2 = null
    primaryPowerPath: Vector2 = new Vector2(0, 1)
    secondaryPowerPath: Vector2 = null
    waterPathSurface: Vector2 = null
    teleport: Teleport = null

    sceneMgr: SceneManager
    entityMgr: EntityManager
    entityType: EntityType = null
    sceneEntity: AnimatedSceneEntity
    level: number = 0
    selected: boolean
    powerSwitch: boolean = true
    primarySurface: Surface = null
    secondarySurface: Surface = null
    primaryPathSurface: Surface = null
    secondaryPathSurface: Surface = null
    upgradeCostOre: number = 0
    upgradeCostBrick: number = 0
    crystalsInUse: number = 0
    inBeam: boolean = false
    beamUpAnimator: BeamUpAnimator = null
    pathTarget: GetToolPathTarget = null
    engineSound: PositionalAudio

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType, aeFilename: string) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
        this.entityType = entityType
        this.sceneEntity = new AnimatedSceneEntity(this.sceneMgr, aeFilename)
        this.sceneEntity.flipXAxis()
        this.upgradeCostOre = ResourceManager.cfg('Main', 'BuildingUpgradeCostOre')
        this.upgradeCostBrick = ResourceManager.cfg('Main', 'BuildingUpgradeCostStuds')
        EventBus.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
            this.updatePowerState()
        })
    }

    abstract get stats(): BuildingEntityStats

    isSelectable(): boolean {
        return !this.selected && !this.inBeam
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.sceneEntity.selectionFrame.visible = true
        this.selected = true
        return true
    }

    deselect() {
        this.sceneEntity.selectionFrame.visible = false
        this.selected = false
    }

    getDropPosition2D(): Vector2 {
        if (this.sceneEntity.animation?.getToolJoint) {
            const worldPos = new Vector3()
            this.sceneEntity.animation.getToolJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else if (this.sceneEntity.animation?.depositJoint) {
            const worldPos = new Vector3()
            this.sceneEntity.animation.depositJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else {
            return this.sceneEntity.position2D.clone()
        }
    }

    isUsable(): boolean {
        return !this.inBeam && this.powerSwitch && (this.isPowered() || this.stats.PowerBuilding) && this.sceneEntity.visible
    }

    isPowered(): boolean {
        return this.stats.SelfPowered || this.crystalsInUse > 0
    }

    hasMaxLevel(): boolean {
        return this.level >= this.stats.Levels - 1
    }

    upgrade() {
        if (!this.canUpgrade()) return
        if (GameState.numBrick >= this.upgradeCostBrick) {
            GameState.numBrick -= this.upgradeCostBrick
        } else {
            GameState.numOre -= this.upgradeCostOre
        }
        EventBus.publishEvent(new MaterialAmountChanged())
        this.level++
        EventBus.publishEvent(new DeselectAll())
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
        // TODO add sparkly upgrade animation
    }

    setLevel(level: number) {
        this.level = level
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
    }

    getDefaultActivity(): BuildingActivity {
        return !this.isPowered() ? BuildingActivity.Unpowered : AnimEntityActivity.Stand
    }

    beamUp() {
        GameState.usedCrystals -= this.crystalsInUse
        this.crystalsInUse = 0
        this.inBeam = true
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.entityMgr.placeMaterial(new Ore(this.sceneMgr, this.entityMgr), this.primarySurface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.entityMgr.placeMaterial(new Crystal(this.sceneMgr, this.entityMgr), this.primarySurface.getRandomPosition())
        }
        this.surfaces.forEach((s) => s.setBuilding(null))
        this.pathTarget = null
        this.beamUpAnimator = new BeamUpAnimator(this)
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
    }

    removeFromScene() {
        this.entityMgr.buildings.remove(this)
    }

    canUpgrade() {
        return !this.hasMaxLevel() && (GameState.numOre >= this.upgradeCostOre || GameState.numBrick >= this.upgradeCostBrick)
    }

    spawnMaterials(type: EntityType, quantity: number) {
        const material = []
        if (type === EntityType.CRYSTAL) {
            while (GameState.numCrystal > 0 && material.length < quantity) {
                GameState.numCrystal--
                material.push(new Crystal(this.sceneMgr, this.entityMgr))
            }
        } else if (type === EntityType.ORE) {
            while (GameState.numOre > 0 && material.length < quantity) {
                GameState.numOre--
                material.push(new Ore(this.sceneMgr, this.entityMgr))
            }
        } else {
            console.error('Material drop not implemented for: ' + type)
        }
        if (material.length > 0) EventBus.publishEvent(new MaterialAmountChanged())
        material.forEach((m) => this.entityMgr.placeMaterial(m, this.getDropPosition2D()))
    }

    spawnBarriers(barrierLocations: BarrierLocation[], site: BuildingSite) {
        barrierLocations.map((l) => new Barrier(this.sceneMgr, this.entityMgr, l, site)).forEach((b) => this.entityMgr.placeMaterial(b, this.getDropPosition2D()))
    }

    spawnFence(targetSurface: Surface) {
        this.entityMgr.placeMaterial(new ElectricFence(this.sceneMgr, this.entityMgr, targetSurface), this.getDropPosition2D())
    }

    setPowerSwitch(state: boolean) {
        this.powerSwitch = state
        this.updatePowerState()
    }

    updatePowerState() {
        if (this.powerSwitch) {
            this.turnPowerOn()
        } else {
            this.turnPowerOff()
        }
        if (this.teleport) this.teleport.powered = this.isPowered()
    }

    turnPowerOn() {
        if (this.crystalsInUse > 0 || this.stats.SelfPowered || GameState.usedCrystals >= GameState.numCrystal || (this.entityType !== EntityType.POWER_STATION && !this.surfaces.some((s) => s.neighbors.some((n) => n.hasPower)))) return
        this.crystalsInUse = 1
        GameState.usedCrystals += this.crystalsInUse
        this.surfaces.forEach((s) => s.setHasPower(true, true))
        this.sceneEntity.changeActivity()
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
        if (this.stats.EngineSound) this.engineSound = this.sceneEntity.playPositionalAudio(this.stats.EngineSound, true)
    }

    turnPowerOff() {
        if (this.crystalsInUse < 1) return
        GameState.usedCrystals -= this.crystalsInUse
        this.crystalsInUse = 0
        this.surfaces.forEach((s) => s.setHasPower(false, false))
        this.sceneEntity.changeActivity()
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
        this.engineSound?.stop()
        this.engineSound = null
    }

    get surfaces(): Surface[] { // TODO performance cache this in member variable
        const result = []
        if (this.primarySurface) result.push(this.primarySurface)
        if (this.secondarySurface) result.push(this.secondarySurface)
        if (this.primaryPathSurface) result.push(this.primaryPathSurface)
        if (this.secondaryPathSurface) result.push(this.secondaryPathSurface)
        return result
    }

    placeDown(worldPosition: Vector2, radHeading: number, disableTeleportIn: boolean) {
        this.primarySurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(worldPosition)
        this.primarySurface.setBuilding(this)
        if (this.secondaryBuildingPart) {
            const secondaryOffset = new Vector2(TILESIZE * this.secondaryBuildingPart.x, TILESIZE * this.secondaryBuildingPart.y)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.secondarySurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(secondaryOffset)
            this.secondarySurface.setBuilding(this)
        }
        if (this.primaryPowerPath) {
            const pathOffset = new Vector2(this.primaryPowerPath.x, this.primaryPowerPath.y).multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.primaryPathSurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.primaryPathSurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
        }
        this.addToScene(worldPosition, radHeading)
        this.sceneEntity.createPickSphere(this.stats.PickSphere, this, this.stats.PickSphere / 4)
        if (this.sceneEntity.visible) {
            this.entityMgr.buildings.push(this)
        } else {
            this.entityMgr.buildingsUndiscovered.push(this)
        }
        if (this.sceneEntity.visible && !disableTeleportIn) {
            this.inBeam = true
            this.sceneEntity.changeActivity(BuildingActivity.Teleport, () => {
                this.inBeam = false
                this.onPlaceDown()
            })
        } else {
            this.onPlaceDown()
        }
        this.sceneMgr.terrain.resetGraphWalk()
    }

    private onPlaceDown() {
        this.sceneEntity.changeActivity()
        this.updatePowerState()
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

    getTrainingTargets() {
        return [new Vector2(-1, 0), new Vector2(0, 1), new Vector2(1, 0), new Vector2(0, -1)]
            .map((v) => {
                const location = v.multiplyScalar(TILESIZE / 2).add(this.primarySurface.getCenterWorld2D())
                return new BuildingPathTarget(location, this)
            })
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        this.sceneEntity.addToScene(worldPosition, radHeading)
        this.pathTarget = new GetToolPathTarget(this)
    }

    getPathTarget(): GetToolPathTarget {
        return this.pathTarget
    }

    isTrainingSite(training: RaiderTraining): boolean {
        return this.entityType === RaiderTrainingSites[training] && this.isUsable() && this.stats[RaiderTrainingStatsProperty[training]][this.level]
    }

    canTeleportIn(entityType: EntityType): boolean {
        return this.teleport?.canTeleportIn(entityType)
    }

}
