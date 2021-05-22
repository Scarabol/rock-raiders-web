import { PositionalAudio, Vector2, Vector3 } from 'three'
import { BuildingEntityStats } from '../../../cfg/BuildingEntityStats'
import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { BuildingsChangedEvent, SelectionChanged } from '../../../event/LocalEvents'
import { MaterialAmountChanged } from '../../../event/WorldEvents'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BuildingActivity } from '../activities/BuildingActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { AnimEntity } from '../anim/AnimEntity'
import { BuildingPathTarget } from '../BuildingPathTarget'
import { Barrier } from '../collect/Barrier'
import { BarrierLocation } from '../collect/BarrierLocation'
import { Crystal } from '../collect/Crystal'
import { ElectricFence } from '../collect/ElectricFence'
import { Ore } from '../collect/Ore'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { PathTarget } from '../PathTarget'
import { Selectable, SelectionType } from '../Selectable'
import { BuildingSite } from './BuildingSite'

export abstract class BuildingEntity extends AnimEntity implements Selectable {

    blocksPathSurface: boolean = true
    secondaryBuildingPart: Vector2 = null
    primaryPowerPath: Vector2 = new Vector2(0, 1)
    secondaryPowerPath: Vector2 = null
    waterPathSurface: Vector2 = null

    level: number = 0
    selected: boolean
    powerSwitch: boolean = true
    spawning: boolean = false
    primarySurface: Surface = null
    secondarySurface: Surface = null
    primaryPathSurface: Surface = null
    secondaryPathSurface: Surface = null
    upgradeCostOre: number = 0
    upgradeCostBrick: number = 0
    crystalsInUse: number = 0
    inBeam: boolean = false
    pathTarget: BuildingPathTarget = null
    engineSound: PositionalAudio

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, entityType, aeFilename)
        this.sceneEntity.flipXAxis()
        this.sceneEntity.setSelectable(this)
        this.upgradeCostOre = ResourceManager.cfg('Main', 'BuildingUpgradeCostOre')
        this.upgradeCostBrick = ResourceManager.cfg('Main', 'BuildingUpgradeCostStuds')
        EventBus.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
            if (this.powerSwitch) this.turnOnPower()
        })
    }

    abstract get stats(): BuildingEntityStats

    getSelectionType(): SelectionType {
        return SelectionType.BUILDING
    }

    select(): boolean {
        if (this.selected || this.inBeam) return false
        this.sceneEntity.selectionFrame.visible = true
        this.selected = true
        return true
    }

    deselect() {
        this.sceneEntity.selectionFrame.visible = false
        this.selected = false
    }

    getDropPosition2D(): Vector2 {
        if (this.animation?.getToolJoint) {
            const worldPos = new Vector3()
            this.animation.getToolJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else if (this.animation?.depositJoint) {
            const worldPos = new Vector3()
            this.animation.depositJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else {
            return this.getPosition2D()
        }
    }

    getDropPosition(): Vector3 {
        return this.sceneMgr.getFloorPosition(this.getDropPosition2D())
    }

    isUsable(): boolean {
        return !this.inBeam && this.powerSwitch && (this.isPowered() || this.stats.PowerBuilding)
    }

    isPowered(): boolean {
        return this.stats.SelfPowered || this.crystalsInUse > 0
    }

    onDiscover() {
        super.onDiscover()
        GameState.buildingsUndiscovered.remove(this)
        GameState.buildings.push(this)
        EventBus.publishEvent(new BuildingsChangedEvent())
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
        EventBus.publishEvent(new SelectionChanged())
        EventBus.publishEvent(new BuildingsChangedEvent())
        // TODO add sparkly upgrade animation
    }

    setLevel(level: number) {
        this.level = level
        EventBus.publishEvent(new BuildingsChangedEvent())
    }

    getDefaultActivity(): BuildingActivity {
        return !this.isPowered() ? BuildingActivity.Unpowered : AnimEntityActivity.Stand
    }

    beamUp() {
        GameState.usedCrystals -= this.crystalsInUse
        this.crystalsInUse = 0
        this.inBeam = true
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.worldMgr.placeMaterial(new Ore(this.worldMgr, this.sceneMgr), this.primarySurface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.worldMgr.placeMaterial(new Crystal(this.worldMgr, this.sceneMgr), this.primarySurface.getRandomPosition())
        }
        this.surfaces.forEach((s) => s.setBuilding(null))
        this.pathTarget = null
        super.beamUp()
        EventBus.publishEvent(new BuildingsChangedEvent())
    }

    removeFromScene() {
        super.removeFromScene()
        GameState.buildings.remove(this)
    }

    canUpgrade() {
        return !this.hasMaxLevel() && (GameState.numOre >= this.upgradeCostOre || GameState.numBrick >= this.upgradeCostBrick)
    }

    spawnMaterials(type: EntityType, quantity: number) {
        const material = []
        if (type === EntityType.CRYSTAL) {
            while (GameState.numCrystal > 0 && material.length < quantity) {
                GameState.numCrystal--
                material.push(new Crystal(this.worldMgr, this.sceneMgr))
            }
        } else if (type === EntityType.ORE) {
            while (GameState.numOre > 0 && material.length < quantity) {
                GameState.numOre--
                material.push(new Ore(this.worldMgr, this.sceneMgr))
            }
        } else {
            console.error('Material drop not implemented for: ' + type)
        }
        if (material.length > 0) EventBus.publishEvent(new MaterialAmountChanged())
        material.forEach((m) => this.worldMgr.placeMaterial(m, this.getDropPosition2D()))
    }

    spawnBarriers(barrierLocations: BarrierLocation[], site: BuildingSite) {
        barrierLocations.map((l) => new Barrier(this.worldMgr, this.sceneMgr, l, site)).forEach((b) => this.worldMgr.placeMaterial(b, this.getDropPosition2D()))
    }

    spawnFence(targetSurface: Surface) {
        this.worldMgr.placeMaterial(new ElectricFence(this.worldMgr, this.sceneMgr, targetSurface), this.getDropPosition2D())
    }

    turnOnPower() {
        if (this.crystalsInUse > 0 || this.stats.SelfPowered || GameState.usedCrystals >= GameState.numCrystal || (this.entityType !== EntityType.POWER_STATION && !this.surfaces.some((s) => s.neighbors.some((n) => n.hasPower)))) return
        this.crystalsInUse = 1
        GameState.usedCrystals += this.crystalsInUse
        this.surfaces.forEach((s) => s.setHasPower(true, true))
        this.changeActivity()
        EventBus.publishEvent(new BuildingsChangedEvent())
        if (this.stats.EngineSound) this.engineSound = this.playPositionalAudio(this.stats.EngineSound, true)
    }

    turnOffPower() {
        if (this.crystalsInUse < 1) return
        GameState.usedCrystals -= this.crystalsInUse
        this.crystalsInUse = 0
        this.surfaces.forEach((s) => s.setHasPower(false, false))
        this.changeActivity()
        EventBus.publishEvent(new BuildingsChangedEvent())
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
        this.sceneEntity.createPickSphere(this.stats.PickSphere, this.stats.PickSphere / 4)
        if (this.sceneEntity.visible) {
            GameState.buildings.push(this)
        } else {
            GameState.buildingsUndiscovered.push(this)
        }
        if (this.sceneEntity.visible && !disableTeleportIn) {
            this.inBeam = true
            this.changeActivity(BuildingActivity.Teleport, () => {
                this.inBeam = false
                this.onPlaceDown()
            })
        } else {
            this.onPlaceDown()
        }
        this.sceneMgr.terrain.resetGraphWalk()
    }

    private onPlaceDown() {
        this.changeActivity()
        this.turnOnPower()
        EventBus.publishEvent(new BuildingsChangedEvent())
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

    getTrainingTargets() {
        return [new Vector2(-1, 0), new Vector2(0, 1), new Vector2(1, 0), new Vector2(0, -1)]
            .map((v) => new PathTarget(v.multiplyScalar(TILESIZE / 2).add(this.primarySurface.getCenterWorld2D())))
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        super.addToScene(worldPosition, radHeading)
        this.pathTarget = new BuildingPathTarget(this)
    }

    getPathTarget(): BuildingPathTarget {
        return this.pathTarget
    }

}
