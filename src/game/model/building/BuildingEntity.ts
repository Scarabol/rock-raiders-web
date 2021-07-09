import { PositionalAudio, Vector2, Vector3 } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { BuildingEntityStats } from '../../../cfg/BuildingEntityStats'
import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { BuildingsChangedEvent, DeselectAll, SelectionChanged } from '../../../event/LocalEvents'
import { MaterialAmountChanged } from '../../../event/WorldEvents'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BuildingSceneEntity } from '../../../scene/entities/BuildingSceneEntity'
import { BeamUpAnimator } from '../../BeamUpAnimator'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { BuildingActivity } from '../activities/BuildingActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { GetToolPathTarget } from '../job/raider/GetToolPathTarget'
import { Surface } from '../map/Surface'
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

    secondaryBuildingPart: Vector2 = null
    primaryPowerPath: Vector2 = new Vector2(0, 1)
    secondaryPowerPath: Vector2 = null
    waterPathSurface: Vector2 = null
    teleport: Teleport = null

    sceneMgr: SceneManager
    entityMgr: EntityManager
    entityType: EntityType = null
    sceneEntity: BuildingSceneEntity
    level: number = 0
    selected: boolean
    powerSwitch: boolean = true
    primarySurface: Surface = null
    secondarySurface: Surface = null
    primaryPathSurface: Surface = null
    secondaryPathSurface: Surface = null
    upgradeCostOre: number = 0
    upgradeCostBrick: number = 0
    energized: boolean = false
    inBeam: boolean = false
    beamUpAnimator: BeamUpAnimator = null
    pathTarget: GetToolPathTarget = null
    engineSound: PositionalAudio
    surfaces: Surface[] = []

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType, aeFilename: string) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
        this.entityType = entityType
        this.sceneEntity = new BuildingSceneEntity(this.sceneMgr, aeFilename)
        this.upgradeCostOre = ResourceManager.cfg('Main', 'BuildingUpgradeCostOre')
        this.upgradeCostBrick = ResourceManager.cfg('Main', 'BuildingUpgradeCostStuds')
        EventBus.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
            this.updateEnergyState()
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

    isReady(): boolean {
        return !this.inBeam && this.sceneEntity.visible
    }

    isPowered(): boolean {
        return this.isReady() && this.powerSwitch && (this.stats.SelfPowered || this.stats.PowerBuilding || this.energized)
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
        if (this.level == level) return
        this.level = level
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
    }

    beamUp() {
        this.inBeam = true
        this.updateEnergyState()
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
        this.sceneEntity.removeFromScene()
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
            console.error(`Material drop not implemented for: ${type}`)
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
        this.updateEnergyState()
    }

    updateEnergyState() {
        if (this.isReady() && this.powerSwitch && (this.energized || (GameState.usedCrystals + this.crystalDrain <= GameState.numCrystal && GameState.numCrystal > 0)) && (this.stats.PowerBuilding || this.surfaces.some((s) => s.energyLevel > 0))) {
            this.turnEnergyOn()
        } else {
            this.turnEnergyOff()
        }
        this.sceneEntity.powered = this.isPowered()
        this.surfaces.forEach((s) => s.updateTexture())
        this.sceneEntity.changeActivity()
        EventBus.publishEvent(new BuildingsChangedEvent(this.entityMgr))
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.entityMgr))
        if (this.teleport) this.teleport.powered = this.isPowered()
    }

    private turnEnergyOn() {
        if (this.energized) return
        this.energized = true
        GameState.changeUsedCrystals(this.crystalDrain)
        if (this.stats.PowerBuilding) this.surfaces.forEach((s) => s.setEnergyLevel(s.energyLevel + 1))
        if (this.stats.EngineSound && !this.engineSound) this.engineSound = this.sceneEntity.playPositionalAudio(this.stats.EngineSound, true)
    }

    private turnEnergyOff() {
        if (!this.energized) return
        this.energized = false
        GameState.changeUsedCrystals(-this.crystalDrain)
        if (this.stats.PowerBuilding) this.surfaces.forEach((s) => s.setEnergyLevel(s.energyLevel - 1))
        this.engineSound = resetAudioSafe(this.engineSound)
    }

    get crystalDrain(): number {
        return (Array.isArray(this.stats.CrystalDrain) ? this.stats.CrystalDrain?.[this.level] : this.stats.CrystalDrain) || 0
    }

    placeDown(worldPosition: Vector2, radHeading: number, disableTeleportIn: boolean) {
        this.primarySurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(worldPosition)
        this.surfaces.push(this.primarySurface)
        this.primarySurface.pathBlockedByBuilding = this.entityType !== EntityType.TOOLSTATION // XXX better evaluate EnterToolStore in stats while path finding
        if (this.secondaryBuildingPart) {
            const secondaryOffset = new Vector2(TILESIZE * this.secondaryBuildingPart.x, TILESIZE * this.secondaryBuildingPart.y)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.secondarySurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(secondaryOffset)
            this.surfaces.push(this.secondarySurface)
            this.secondarySurface.pathBlockedByBuilding = this.entityType !== EntityType.TOOLSTATION // XXX better evaluate EnterToolStore in stats while path finding
        }
        if (this.primaryPowerPath) {
            const pathOffset = new Vector2(this.primaryPowerPath.x, this.primaryPowerPath.y).multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.primaryPathSurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.surfaces.push(this.primaryPathSurface)
        }
        if (this.secondaryPowerPath) {
            const pathOffset = new Vector2(this.secondaryPowerPath.x, this.secondaryPowerPath.y).multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.secondaryPathSurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.surfaces.push(this.secondaryPathSurface)
        }
        this.surfaces.forEach((s) => s.setBuilding(this))
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
        this.sceneMgr.terrain.pathFinder.resetGraphsAndCaches()
    }

    private onPlaceDown() {
        this.updateEnergyState()
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
        return this.entityType === RaiderTrainingSites[training] && this.isPowered() && this.stats[RaiderTrainingStatsProperty[training]][this.level]
    }

    canTeleportIn(entityType: EntityType): boolean {
        return this.teleport?.canTeleportIn(entityType)
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
        this.beamUpAnimator?.update(elapsedMs)
    }

}
