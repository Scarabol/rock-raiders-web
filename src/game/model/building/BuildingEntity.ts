import { Vector2, Vector3 } from 'three'
import { SoundManager } from '../../../audio/SoundManager'
import { BuildingEntityStats } from '../../../cfg/GameStatsCfg'
import { BuildingsChangedEvent, DeselectAll, SelectionChanged, UpdateRadarEntityEvent } from '../../../event/LocalEvents'
import { MaterialAmountChanged, UsedCrystalsChanged } from '../../../event/WorldEvents'
import { DEV_MODE, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BubbleSprite } from '../../../scene/BubbleSprite'
import { WorldManager } from '../../WorldManager'
import { BuildingActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../../terrain/Surface'
import { PathTarget } from '../PathTarget'
import { RaiderTraining, RaiderTrainings } from '../raider/RaiderTraining'
import { BuildingSite } from './BuildingSite'
import { BuildingType } from './BuildingType'
import { GameEntity } from '../../ECS'
import { HealthComponent } from '../../component/HealthComponent'
import { MaterialEntity } from '../material/MaterialEntity'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { MaterialSpawner } from '../../factory/MaterialSpawner'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { OxygenComponent } from '../../component/OxygenComponent'
import { PositionComponent } from '../../component/PositionComponent'
import { LastWillComponent } from '../../component/LastWillComponent'
import { ScannerComponent } from '../../component/ScannerComponent'
import { MapMarkerChange, MapMarkerType } from '../../component/MapMarkerComponent'
import { GameConfig } from '../../../cfg/GameConfig'
import { EventBroker } from '../../../event/EventBroker'
import { TooltipComponent } from '../../component/TooltipComponent'
import { TooltipSpriteBuilder } from '../../../resource/TooltipSpriteBuilder'
import { TeleportComponent } from '../../component/TeleportComponent'
import { LaserBeamTurretComponent } from '../../component/LaserBeamTurretComponent'
import { AnimatedSceneEntityComponent } from '../../component/AnimatedSceneEntityComponent'
import { SurfaceType } from '../../terrain/SurfaceType'

export class BuildingEntity {
    readonly carriedItems: MaterialEntity[] = []
    readonly entity: GameEntity
    buildingType: BuildingType
    sceneEntity: AnimatedSceneEntity
    powerOffSprite: BubbleSprite
    level: number = 0
    powerSwitch: boolean = true
    primarySurface: Surface
    secondarySurface?: Surface
    primaryPathSurface?: Surface
    secondaryPathSurface?: Surface
    waterPathSurface?: Surface
    energized: boolean = false
    getToolPathTarget?: PathTarget
    carryPathTarget?: PathTarget
    engineSoundId?: number
    surfaces: Surface[] = []
    pathSurfaces: Surface[] = []

    constructor(readonly worldMgr: WorldManager, readonly entityType: EntityType, worldPosition: Vector2, radHeading: number, disableTeleportIn: boolean) {
        this.entity = this.worldMgr.ecs.addEntity()
        this.buildingType = BuildingType.from(this.entityType)
        this.sceneEntity = new AnimatedSceneEntity()
        this.sceneEntity.addAnimated(ResourceManager.getAnimatedData(this.buildingType.aeFilename))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        this.powerOffSprite = new BubbleSprite(GameConfig.instance.bubbles.bubblePowerOff)
        this.powerOffSprite.visible = this.isPowered()
        this.sceneEntity.add(this.powerOffSprite)
        this.worldMgr.sceneMgr.addSprite(this.powerOffSprite)
        const healthComponent = this.worldMgr.ecs.addComponent(this.entity, new HealthComponent(this.stats.DamageCausesCallToArms, 24, 14, this.sceneEntity, false, GameConfig.instance.getRockFallDamage(entityType, this.level)))
        this.worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
        this.worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
        this.worldMgr.ecs.addComponent(this.entity, new LastWillComponent(() => {
            this.worldMgr.entityMgr.removeEntity(this.entity)
            this.primarySurface.pathBlockedByBuilding = false
            if (this.secondarySurface) this.secondarySurface.pathBlockedByBuilding = false
            this.setEnergized(false)
            this.sceneEntity.setAnimation(BuildingActivity.Explode, () => this.disposeFromWorld())
            this.powerOffSprite.setEnabled(false)
            this.surfaces.forEach((s) => s.setBuilding(undefined))
            this.surfaces.forEach((s) => this.worldMgr.sceneMgr.terrain.pathFinder.updateSurface(s))
            this.worldMgr.sceneMgr.terrain.pathFinder.resetGraphsAndCaches()
            EventBroker.publish(new BuildingsChangedEvent(this.worldMgr.entityMgr))
        }))
        const objectName = this.buildingType.getObjectName(this.level)
        if (objectName) this.worldMgr.ecs.addComponent(this.entity, new TooltipComponent(this.entity, objectName, this.buildingType.getSfxKey(), () => {
            const objectName = this.buildingType.getObjectName(this.level)
            return TooltipSpriteBuilder.getTooltipSprite(objectName, healthComponent.health)
        }))
        if (entityType === EntityType.GUNSTATION) {
            const weaponCfg = GameConfig.instance.weaponTypes.bigLazer
            this.worldMgr.ecs.addComponent(this.entity, new LaserBeamTurretComponent(weaponCfg))
        }
        this.primarySurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPosition)
        this.surfaces.push(this.primarySurface)
        this.primarySurface.pathBlockedByBuilding = this.entityType !== EntityType.TOOLSTATION // XXX better evaluate EnterToolStore in stats while path finding
        if (this.buildingType.secondaryBuildingPart) {
            const secondaryOffset = new Vector2(TILESIZE * this.buildingType.secondaryBuildingPart.x, TILESIZE * this.buildingType.secondaryBuildingPart.y)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.secondarySurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(secondaryOffset)
            this.surfaces.push(this.secondarySurface)
            this.secondarySurface.pathBlockedByBuilding = this.entityType !== EntityType.TOOLSTATION // XXX better evaluate EnterToolStore in stats while path finding
        }
        if (this.buildingType.primaryPowerPath) {
            const pathOffset = this.buildingType.primaryPowerPath.clone().multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            if (surface.surfaceType.floor || surface.surfaceType === SurfaceType.HIDDEN_CAVERN) {
                this.primaryPathSurface = surface
                this.surfaces.push(this.primaryPathSurface)
                this.pathSurfaces.push(this.primaryPathSurface)
            }
        }
        if (this.buildingType.secondaryPowerPath) {
            const pathOffset = this.buildingType.secondaryPowerPath.clone().multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.secondaryPathSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.surfaces.push(this.secondaryPathSurface)
            this.pathSurfaces.push(this.secondaryPathSurface)
        }
        if (this.buildingType.waterPathSurface) {
            const pathOffset = this.buildingType.waterPathSurface.clone().multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.waterPathSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.pathSurfaces.push(this.waterPathSurface)
        }
        this.surfaces.forEach((s) => s.setBuilding(this))
        const sceneSelectionComponent = this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity, {
            gameEntity: this.entity,
            entityType: this.entityType
        }, this.stats))
        const floorPosition = this.worldMgr.sceneMgr.getFloorPosition(worldPosition)
        floorPosition.y = Math.max(...this.surfaces.map((s) => this.worldMgr.sceneMgr.getFloorPosition(s.getCenterWorld2D()).y))
        const positionComponent = this.worldMgr.ecs.addComponent(this.entity, new PositionComponent(floorPosition, this.primarySurface))
        this.sceneEntity.position.copy(floorPosition)
        this.sceneEntity.position.y += positionComponent.floorOffset
        this.sceneEntity.rotation.y = radHeading
        this.sceneEntity.visible = this.surfaces.some((s) => s.discovered)
        this.worldMgr.sceneMgr.addSceneEntity(this.sceneEntity)
        if (this.sceneEntity.visible) {
            this.worldMgr.entityMgr.buildings.push(this)
        } else {
            this.worldMgr.entityMgr.buildingsUndiscovered.push(this)
        }
        if (this.surfaces.some((s) => s.selected)) EventBroker.publish(new DeselectAll())
        if (this.sceneEntity.visible && !disableTeleportIn) {
            this.powerOffSprite.setEnabled(!this.inBeam && !this.isPowered())
            this.sceneEntity.setAnimation(BuildingActivity.Teleport, () => {
                this.worldMgr.ecs.addComponent(this.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, this.stats))
                this.powerOffSprite.setEnabled(!this.isPowered())
                this.onPlaceDown()
            })
        } else {
            this.worldMgr.ecs.addComponent(this.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, this.stats))
            this.onPlaceDown()
        }
        this.surfaces.forEach((s) => this.worldMgr.sceneMgr.terrain.pathFinder.updateSurface(s))
        this.worldMgr.sceneMgr.terrain.pathFinder.resetGraphsAndCaches()
    }

    get stats(): BuildingEntityStats {
        return this.buildingType.stats
    }

    get inBeam(): boolean {
        return !this.worldMgr.ecs.getComponents(this.entity).has(SelectionFrameComponent)
    }

    get selected(): boolean {
        const selectionFrameComponent = this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)
        return selectionFrameComponent?.isSelected()
    }

    isSelectable(): boolean {
        return !this.selected && !this.inBeam
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.select()
        return true
    }

    doubleSelect(): boolean {
        if (!this.selected || !this.isPowered()) return false
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.doubleSelect()
        return true
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }

    getDropPosition2D(): Vector2 {
        const worldPos = this.getPosition()
        if (this.sceneEntity.toolParent) {
            this.sceneEntity.toolParent.getWorldPosition(worldPos)
        } else if (this.sceneEntity.depositParent) {
            this.sceneEntity.depositParent.getWorldPosition(worldPos)
        }
        return new Vector2(worldPos.x, worldPos.z)
    }

    isReady(): boolean {
        return !this.inBeam && this.sceneEntity.visible
    }

    isPowered(): boolean {
        return this.isReady() && this.powerSwitch && (this.stats.SelfPowered || this.stats.PowerBuilding || this.energized)
    }

    upgrade() {
        if (!this.canUpgrade()) return
        if (GameState.numBrick >= GameConfig.instance.main.buildingUpgradeCostStuds) {
            GameState.numBrick -= GameConfig.instance.main.buildingUpgradeCostStuds
        } else {
            GameState.numOre -= GameConfig.instance.main.buildingUpgradeCostOre
        }
        EventBroker.publish(new MaterialAmountChanged())
        this.level++
        const components = this.worldMgr.ecs.getComponents(this.entity)
        components.get(HealthComponent).rockFallDamage = GameConfig.instance.getRockFallDamage(this.entityType, this.level)
        EventBroker.publish(new DeselectAll())
        EventBroker.publish(new BuildingsChangedEvent(this.worldMgr.entityMgr))
        this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.UpgradeEffect, this.primarySurface.getCenterWorld(), this.sceneEntity.heading, false)
        components.get(ScannerComponent)?.setRange(this.stats.SurveyRadius?.[this.level] ?? 0)
        this.sceneEntity.setUpgradeLevel(this.level.toString(2).padStart(4, '0'))
    }

    setLevel(level: number) {
        if (this.level == level || level > this.stats.maxLevel) return
        this.level = level
        EventBroker.publish(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    beamUp() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
        this.worldMgr.ecs.removeComponent(this.entity, SelectionFrameComponent)
        this.primarySurface.pathBlockedByBuilding = false
        if (this.secondarySurface) this.secondarySurface.pathBlockedByBuilding = false
        this.setEnergized(false)
        this.sceneEntity.setAnimation(BuildingActivity.Stand)
        this.powerOffSprite.setEnabled(false)
        this.surfaces.forEach((s) => s.setBuilding(undefined))
        this.surfaces.forEach((s) => this.worldMgr.sceneMgr.terrain.pathFinder.updateSurface(s))
        this.worldMgr.sceneMgr.terrain.pathFinder.resetGraphsAndCaches()
        this.worldMgr.ecs.removeComponent(this.entity, ScannerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.SCANNER, this.entity, MapMarkerChange.REMOVE))
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        EventBroker.publish(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    disposeFromWorld() {
        this.worldMgr.sceneMgr.disposeSceneEntity(this.sceneEntity)
        this.worldMgr.sceneMgr.removeSprite(this.powerOffSprite)
        this.engineSoundId = SoundManager.stopAudio(this.engineSoundId)
        this.worldMgr.entityMgr.removeEntity(this.entity)
        this.worldMgr.ecs.removeEntity(this.entity)
    }

    canUpgrade() {
        return !(this.level >= this.stats.maxLevel) && (GameState.numOre >= GameConfig.instance.main.buildingUpgradeCostOre || GameState.numBrick >= GameConfig.instance.main.buildingUpgradeCostStuds)
    }

    missingOreForUpgrade(): number {
        return this.level >= this.stats.maxLevel ? 0 : Math.max(0, GameConfig.instance.main.buildingUpgradeCostOre - GameState.numOre)
    }

    spawnMaterials(type: EntityType, quantity: number) {
        const material: MaterialEntity[] = [] // XXX actually this does not require a list
        if (type === EntityType.CRYSTAL) {
            while (GameState.numCrystal > 0 && material.length < quantity) {
                GameState.numCrystal--
                material.push(MaterialSpawner.spawnMaterial(this.worldMgr, type, this.getDropPosition2D()))
            }
        } else if (type === EntityType.ORE) {
            while (GameState.numOre > 0 && material.length < quantity) {
                GameState.numOre--
                material.push(MaterialSpawner.spawnMaterial(this.worldMgr, type, this.getDropPosition2D()))
            }
        } else if (type === EntityType.BRICK) {
            while (GameState.numBrick > 0 && material.length < quantity) {
                GameState.numBrick--
                material.push(MaterialSpawner.spawnMaterial(this.worldMgr, type, this.getDropPosition2D()))
            }
        } else {
            console.error(`Material drop not implemented for: ${type}`)
        }
    }

    spawnBarriers(barrierLocations: Vector2[], site: BuildingSite) {
        barrierLocations.forEach((l) => {
            MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.BARRIER, this.getDropPosition2D(), undefined, undefined, l, site)
        })
    }

    spawnFence(targetSurface: Surface) {
        MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.ELECTRIC_FENCE, this.getDropPosition2D(), undefined, targetSurface)
    }

    setPowerSwitch(state: boolean) {
        this.powerSwitch = state
        this.updateEnergyState()
    }

    updateEnergyState() {
        if (this.isReady() && this.powerSwitch && (this.energized || (GameState.usedCrystals + this.crystalDrain <= GameState.numCrystal && GameState.numCrystal > 0)) && (this.stats.PowerBuilding || this.surfaces.some((s) => s.energized))) {
            this.setEnergized(true)
        } else {
            this.setEnergized(false)
        }
    }

    setEnergized(energized: boolean) {
        if (this.energized !== energized) {
            this.energized = energized
            if (this.energized) {
                this.changeUsedCrystals(this.crystalDrain)
                if (this.stats.PowerBuilding) this.worldMgr.powerGrid.addEnergySource(this.surfaces)
                if (this.stats.EngineSound && !this.engineSoundId && !DEV_MODE) this.engineSoundId = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, this.stats.EngineSound, true)
                if (this.stats.OxygenCoef) this.worldMgr.ecs.addComponent(this.entity, new OxygenComponent(this.stats.OxygenCoef))
                const components = this.worldMgr.ecs.getComponents(this.entity)
                if (!components.has(ScannerComponent)) {
                    const scannerRange = this.stats.SurveyRadius?.[this.level] ?? 0
                    if (scannerRange > 0 && this.primarySurface) this.worldMgr.ecs.addComponent(this.entity, new ScannerComponent(scannerRange))
                }
            } else {
                this.changeUsedCrystals(-this.crystalDrain)
                if (this.stats.PowerBuilding) this.worldMgr.powerGrid.removeEnergySource(this.surfaces)
                this.engineSoundId = SoundManager.stopAudio(this.engineSoundId)
                this.worldMgr.ecs.removeComponent(this.entity, OxygenComponent)
            }
        }
        if (this.sceneEntity.currentAnimation === BuildingActivity.Stand || this.sceneEntity.currentAnimation === BuildingActivity.Unpowered) {
            this.sceneEntity.setAnimation(this.isPowered() ? BuildingActivity.Stand : BuildingActivity.Unpowered)
        }
        this.powerOffSprite.setEnabled(!this.inBeam && !this.isPowered())
        this.surfaces.forEach((s) => s.updateTexture())
        EventBroker.publish(new BuildingsChangedEvent(this.worldMgr.entityMgr))
        if (this.selected || (this.entityType === EntityType.UPGRADE && this.worldMgr.entityMgr.selection.vehicles.length > 0)) {
            EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
        }
    }

    get crystalDrain(): number {
        return Array.ensure(this.stats.CrystalDrain)[this.level] || 0
    }

    private changeUsedCrystals(changedCrystals: number) {
        if (!changedCrystals) return
        GameState.usedCrystals += changedCrystals
        EventBroker.publish(new UsedCrystalsChanged())
    }

    private onPlaceDown() {
        this.sceneEntity.setAnimation(BuildingActivity.Stand)
        this.updateEnergyState()
        this.surfaces.forEach((surface) => {
            surface.updateTexture()
            if (surface.surfaceType.connectsPath) surface.neighbors.forEach((n) => n.updateTexture())
            this.worldMgr.powerGrid.onPathChange(surface)
        })
        this.getToolPathTarget = PathTarget.fromBuilding(this, this.getDropPosition2D(), 1, this.primarySurface.getCenterWorld2D())
        this.carryPathTarget = PathTarget.fromBuilding(this, this.getDropPosition2D(), 1, this.primarySurface.getCenterWorld2D())
        if (this.buildingType.teleportedEntityTypes.length > 0 && this.primaryPathSurface) this.worldMgr.ecs.addComponent(this.entity, new TeleportComponent(this.buildingType.teleportedEntityTypes, this.pathSurfaces, this.sceneEntity.heading, this.primaryPathSurface, this.waterPathSurface))
        EventBroker.publish(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    getTrainingTargets(): PathTarget[] {
        const offset = TILESIZE * 11 / 20
        return this.buildingSurfaces.flatMap((s) => { // XXX Filter out targets in between both surfaces
            const center = s.getCenterWorld2D()
            return [
                PathTarget.fromBuilding(this, new Vector2(-offset, 0).add(center), 1, center),
                PathTarget.fromBuilding(this, new Vector2(0, offset).add(center), 1, center),
                PathTarget.fromBuilding(this, new Vector2(offset, 0).add(center), 1, center),
                PathTarget.fromBuilding(this, new Vector2(0, -offset).add(center), 1, center),
            ]
        })
    }

    isTrainingSite(training: RaiderTraining): boolean {
        const statsProperty = RaiderTrainings.toStatsProperty(training)
        const stat = this.stats[statsProperty]
        return this.isPowered() && stat?.[this.level]
    }

    getMaxCarry(): number {
        return this.stats.MaxCarry[this.level] ?? 0
    }

    pickupItem(item: MaterialEntity): void {
        this.sceneEntity.pickupEntity(item.sceneEntity)
        this.carriedItems.push(item)
    }

    depositItems(): void {
        if (this.entityType === EntityType.ORE_REFINERY) {
            MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.BRICK, this.getDropPosition2D())
        } else {
            this.carriedItems.forEach((m) => this.worldMgr.depositItem(m))
        }
        this.carriedItems.forEach((m) => m.disposeFromWorld())
        this.carriedItems.length = 0
    }

    getPosition(): Vector3 {
        return this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).position.clone()
    }

    getPosition2D(): Vector2 {
        return this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).getPosition2D()
    }

    setPosition(position: Vector3) {
        this.sceneEntity.position.copy(position)
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(position)
        this.sceneEntity.visible = surface.discovered
        const positionComponent = this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)
        if (positionComponent) {
            positionComponent.position.copy(position)
            positionComponent.surface = surface
            positionComponent.markDirty()
            this.sceneEntity.position.y += positionComponent.floorOffset
        }
    }

    get buildingSurfaces(): Surface[] {
        const result: Surface[] = []
        if (this.primarySurface) result.push(this.primarySurface)
        if (this.secondarySurface) result.add(this.secondarySurface)
        return result
    }
}
