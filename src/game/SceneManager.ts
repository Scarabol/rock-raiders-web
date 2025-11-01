import { Color, FogExp2, Group, Object3D, PerspectiveCamera, PositionalAudio, Raycaster, Scene, Sprite, Vector2, Vector3 } from 'three'
import { LevelConfData } from './LevelLoader'
import { BirdViewControls } from '../scene/BirdViewControls'
import { BuildPlacementMarker } from './model/building/BuildPlacementMarker'
import { EntityType } from './model/EntityType'
import { GameState } from './model/GameState'
import { Terrain } from './terrain/Terrain'
import { TerrainLoader } from './TerrainLoader'
import { WorldManager } from './WorldManager'
import { BirdViewCamera } from '../scene/BirdViewCamera'
import { TorchLightCursor } from '../scene/TorchLightCursor'
import { SceneRenderer } from '../scene/SceneRenderer'
import { Updatable, updateSafe } from './model/Updateable'
import { CAMERA_FOV, CAMERA_MAX_SHAKE_BUMP, CAMERA_MIN_HEIGHT_ABOVE_TERRAIN, CAMERA_PAN_LIMIT_MARGIN, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SoundManager } from '../audio/SoundManager'
import { SceneEntity } from './SceneEntity'
import { AnimationGroup } from '../scene/AnimationGroup'
import { createCanvas } from '../core/ImageHelper'
import { FollowerRenderer } from '../scene/FollowerRenderer'
import { EventKey } from '../event/EventKeyEnum'
import { LeveledAmbientLight } from '../scene/LeveledAmbientLight'
import { EventBroker } from '../event/EventBroker'
import { ObjectPointer } from '../scene/ObjectPointer'
import { PathFinder } from './terrain/PathFinder'
import { ANIM_ENTITY_ACTIVITY, RAIDER_ACTIVITY } from './model/anim/AnimationActivity'
import { Raider } from './model/raider/Raider'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { CameraFrustumUpdater } from '../scene/CameraFrustumUpdater'
import { SelectionNameComponent } from './component/SelectionNameComponent'
import { GameConfig } from '../cfg/GameConfig'
import { PositionComponent } from './component/PositionComponent'
import { RaidersAmountChangedEvent } from '../event/LocalEvents'
import { RaiderInfoComponent } from './component/RaiderInfoComponent'

export class SceneManager implements Updatable {
    readonly scene: Scene
    readonly cameraBird: BirdViewCamera
    readonly cameraShoulder: PerspectiveCamera
    readonly cameraFPV: PerspectiveCamera
    readonly renderer: SceneRenderer
    readonly birdViewControls: BirdViewControls
    readonly sceneObjects: SceneEntity[] = []
    readonly sprites: (Sprite & Updatable)[] = []
    readonly raycaster: Raycaster = new Raycaster()
    readonly objectPointer: ObjectPointer = new ObjectPointer()
    readonly tempBirdTargetDelta: Vector3 = new Vector3()
    readonly cameraMinPos = new Vector3()
    readonly cameraMaxPos = new Vector3()
    ambientLight: LeveledAmbientLight = new LeveledAmbientLight()
    terrain!: Terrain // TODO Refactor terrain handling, split into data and mesh
    floorGroup: Group = new Group()
    roofGroup: Group = new Group()
    torchLightCursor: TorchLightCursor = new TorchLightCursor()
    buildMarker: BuildPlacementMarker | undefined
    followerRenderer!: FollowerRenderer
    cameraActive!: PerspectiveCamera
    entityTurnSpeed: number = 0
    entityMoveMultiplier: number = 0
    frustumUpdater: CameraFrustumUpdater
    fogColor: Color = new Color()

    constructor(readonly worldMgr: WorldManager, canvas: HTMLCanvasElement) {
        this.worldMgr.sceneMgr = this
        this.scene = new Scene()
        const aspect = canvas.width / canvas.height
        this.cameraBird = new BirdViewCamera(aspect)
        this.cameraShoulder = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 24 * TILESIZE)
        this.cameraFPV = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 24 * TILESIZE)
        this.renderer = new SceneRenderer(canvas)
        this.birdViewControls = new BirdViewControls(this.cameraBird, canvas)
        if (!SaveGameManager.preferences.cameraUnlimited) this.birdViewControls.addEventListener('change', () => this.limitCameraBird())
        this.frustumUpdater = new CameraFrustumUpdater(this.cameraBird)
        this.birdViewControls.addEventListener('change', () => this.frustumUpdater.onCameraMoved())
        EventBroker.subscribe(EventKey.SELECTION_CHANGED, () => {
            this.setActiveCamera(this.cameraBird) // TODO Only reset camera, when camera parent is affected
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            this.ambientLight?.setLightLevel(SaveGameManager.preferences.gameBrightness)
        })
        EventBroker.subscribe(EventKey.GUI_GO_BACK_BUTTON_CLICKED, () => {
            this.setBuildModeSelection(undefined)
        })
        EventBroker.subscribe(EventKey.RAIDER_AMOUNT_CHANGED, (event: RaidersAmountChangedEvent) => {
            if (!event.hasRaider) this.setBuildModeSelection(undefined) // TODO Check dependencies precisely
        })
        EventBroker.subscribe(EventKey.BUILDINGS_CHANGED, () => {
            this.setBuildModeSelection(undefined) // TODO Check dependencies precisely
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            this.terrain.forEachSurface((s) => s.mesh.setProMeshEnabled(SaveGameManager.preferences.wallDetails))
        })
    }

    setActiveCamera(camera: PerspectiveCamera) {
        if (this.cameraActive === camera) return
        GameState.isBirdView = camera === this.cameraBird
        if (this.torchLightCursor) this.torchLightCursor.visible = GameState.isBirdView
        this.birdViewControls.disabled = !GameState.isBirdView
        if (this.roofGroup) this.roofGroup.visible = !GameState.isBirdView
        if (GameState.isBirdView) {
            this.scene.background = null
            this.scene.fog = null
            const selectedEntityPosition = this.worldMgr.entityMgr?.selection.getPrimarySelected()?.getPosition2D()
            if (selectedEntityPosition) this.birdViewControls.jumpTo(this.getFloorPosition(selectedEntityPosition))
        } else {
            this.scene.background = this.fogColor // fog color must be equal to scene background to avoid "holes" in fog at max rendering distance
            this.scene.fog = new FogExp2(this.fogColor, 0.0025)
        }
        // TODO Refactor raider info component updates with ECS
        this.worldMgr.entityMgr?.selection.raiders.forEach((r) => this.worldMgr.ecs.getComponents(r.entity).getOptional(SelectionNameComponent)?.setVisible(GameState.isBirdView))
        this.worldMgr.entityMgr?.raiders.forEach((r) => {
            const infoComponent = r.worldMgr.ecs.getComponents(r.entity).getOptional(RaiderInfoComponent)
            if (infoComponent) {
                infoComponent.bubbleSprite.updateVisibleState()
                infoComponent.hungerSprite.visible = GameState.showObjInfo && GameState.isBirdView
            }
        })
        this.cameraActive = camera
        this.cameraActive.add(SoundManager.sceneAudioListener)
        this.renderer.camera = camera
    }

    setupScene(levelConf: LevelConfData) {
        this.scene.clear()
        this.fogColor = new Color().fromArray(levelConf.fogColor)
        this.ambientLight = new LeveledAmbientLight()
        this.ambientLight.setLightLevel(SaveGameManager.preferences.gameBrightness)
        this.scene.add(this.ambientLight)

        this.torchLightCursor = new TorchLightCursor()
        this.scene.add(this.torchLightCursor)
        this.birdViewControls.setupControls()
        this.birdViewControls.addEventListener('change', this.torchLightCursor.changeListener)

        this.buildMarker = new BuildPlacementMarker(this.worldMgr)
        this.scene.add(this.buildMarker.group)
        this.setBuildModeSelection(undefined)

        this.floorGroup = new Group()
        this.roofGroup = new Group()
        this.roofGroup.visible = false
        this.terrain = TerrainLoader.loadTerrain(levelConf, this.worldMgr)
        this.terrain.forEachSurface((s) => {
            this.floorGroup.add(s.mesh)
            this.roofGroup.add(s.roofMesh)
        })
        this.scene.add(this.floorGroup)
        this.scene.add(this.roofGroup)

        this.cameraMinPos.set(CAMERA_PAN_LIMIT_MARGIN * TILESIZE, -GameConfig.instance.main.maxDist, CAMERA_PAN_LIMIT_MARGIN * TILESIZE)
        this.cameraMaxPos.set((this.terrain.width - CAMERA_PAN_LIMIT_MARGIN) * TILESIZE, GameConfig.instance.main.maxDist, (this.terrain.height - CAMERA_PAN_LIMIT_MARGIN) * TILESIZE)
        this.setActiveCamera(this.cameraBird)

        const followerCanvas = createCanvas(158, 158)
        this.followerRenderer = new FollowerRenderer(followerCanvas, this.scene, this.worldMgr.ecs)

        if (levelConf.blockPointersMap) {
            for (let x = 0; x < levelConf.mapWidth; x++) {
                for (let y = 0; y < levelConf.mapHeight; y++) {
                    const tutoBlockId = levelConf.blockPointersMap[y][x]
                    if (tutoBlockId) {
                        const tutoBlock = this.terrain.surfaces[x][y]
                        tutoBlock.mesh.objectPointer = new ObjectPointer()
                        this.scene.add(tutoBlock.mesh.objectPointer)
                        this.worldMgr.nerpRunner.tutoBlocksById.getOrUpdate(tutoBlockId, () => []).push(tutoBlock)
                    }
                }
            }
        }
    }

    async startScene(): Promise<void> {
        await this.renderer.startRendering(this.scene)
        this.frustumUpdater.onCameraMoved()
    }

    update(elapsedMs: number) {
        this.sceneObjects.forEach((e) => updateSafe(e, elapsedMs))
        this.sprites.forEach((s) => updateSafe(s, elapsedMs))
        updateSafe(this.torchLightCursor, elapsedMs)
        this.birdViewControls?.updateControlsSafe(elapsedMs)
        this.objectPointer.update(elapsedMs)
        Array.from(this.worldMgr.nerpRunner.tutoBlocksById.values()).forEach((s) => s.forEach((t) => {
            t.mesh.objectPointer?.update(elapsedMs)
        }))
        const selectedEntity = this.worldMgr.entityMgr.selection.getPrimarySelected()
        if (selectedEntity && (this.cameraActive === this.cameraShoulder || this.cameraActive === this.cameraFPV)) {
            this.updateEgoMovement(selectedEntity, elapsedMs)
        }
    }

    private updateEgoMovement(selectedEntity: Raider | VehicleEntity, elapsedMs: number) {
        if (this.entityTurnSpeed) selectedEntity.sceneEntity.rotateY(this.entityTurnSpeed * elapsedMs / NATIVE_UPDATE_INTERVAL)
        let animationName = selectedEntity.getDefaultAnimationName()
        if (this.entityMoveMultiplier) {
            // TODO Reuse determineStep code here
            const step = selectedEntity.sceneEntity.getWorldDirection(new Vector3()).setLength(selectedEntity.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL).multiplyScalar(this.entityMoveMultiplier)
            const world = selectedEntity.getPosition().add(step)
            const targetPosition = this.worldMgr.sceneMgr.getFloorPosition(new Vector2(world.x, world.z))
            targetPosition.y += this.worldMgr.ecs.getComponents(selectedEntity.entity).getOptional(PositionComponent)?.floorOffset ?? 0
            const targetSurface = this.terrain.getSurfaceFromWorld(targetPosition)
            if (selectedEntity.getSurface() === targetSurface || PathFinder.getWeight(targetSurface, selectedEntity.stats) > 0) {
                selectedEntity.setPosition(targetPosition)
                animationName = !!((selectedEntity as Raider).carries) ? ANIM_ENTITY_ACTIVITY.carry : ANIM_ENTITY_ACTIVITY.route
                selectedEntity.onEntityMoved()
            } else {
                const origin = selectedEntity.getPosition()
                const lookVector = new Vector3(0, 0, 1).applyMatrix4(selectedEntity.sceneEntity.matrix).sub(origin)
                const vecToSurf = targetSurface.getCenterWorld().clone().sub(origin)
                if (Math.abs(lookVector.angleTo(vecToSurf)) < Math.PI / 2) {
                    const drillTimeSeconds = selectedEntity.getDrillTimeSeconds(targetSurface)
                    if (drillTimeSeconds > 0) {
                        animationName = RAIDER_ACTIVITY.drill
                        targetSurface.addDrillTimeProgress(drillTimeSeconds, elapsedMs, selectedEntity.getPosition2D())
                    }
                }
            }
        }
        if (selectedEntity.selected) selectedEntity.sceneEntity.setAnimation(animationName) // raider may have slipped, when moved
    }

    disposeScene() {
        this.scene.clear()
        this.renderer.dispose()
        this.followerRenderer?.dispose()
        GameState.remainingDiggables = this.terrain?.countDiggables() || 0
        this.terrain?.dispose()
        this.sceneObjects.forEach((e) => e.dispose())
        this.sceneObjects.length = 0
    }

    resize(width: number, height: number) {
        this.renderer.setSize(width, height)
        const aspect = width / height
        this.cameraBird.aspect = aspect
        this.cameraBird.updateProjectionMatrix()
        this.cameraShoulder.aspect = aspect
        this.cameraShoulder.updateProjectionMatrix()
        this.cameraFPV.aspect = aspect
        this.cameraFPV.updateProjectionMatrix()
    }

    setCursorFloorPosition(position: Vector3) {
        this.birdViewControls.removeEventListener('change', this.torchLightCursor.changeListener) // XXX Actually only required once
        this.torchLightCursor.position.copy(position)
    }

    getFloorPosition(world: Vector2) {
        return this.terrain.getFloorPosition(world)
    }

    hasBuildModeSelection(): boolean {
        return !!this.buildMarker?.hasBuildMode()
    }

    setBuildModeSelection(entityType: EntityType | undefined) {
        this.buildMarker?.setBuildMode(entityType)
    }

    addSceneEntity(sceneEntity: SceneEntity): void {
        this.sceneObjects.add(sceneEntity)
        this.scene.add(sceneEntity)
    }

    disposeSceneEntity(sceneEntity: SceneEntity): void {
        this.sceneObjects.remove(sceneEntity)
        this.scene.remove(sceneEntity)
        sceneEntity.dispose()
    }

    addMiscAnim(lwsFilename: string, position: Vector3, heading: number, loop: boolean, onRemove?: () => unknown) {
        const group = new AnimationGroup(lwsFilename, loop ? undefined : () => {
            this.disposeSceneEntity(group)
            if (onRemove) onRemove()
        }).setup().play()
        group.position.copy(position)
        group.rotateOnAxis(Object3D.DEFAULT_UP, heading)
        this.addSceneEntity(group)
        return group
    }

    addSprite(sprite: (Sprite & Updatable)) {
        this.sprites.add(sprite)
    }

    removeSprite(sprite: (Sprite & Updatable)) {
        this.sprites.remove(sprite)
    }

    addPositionalAudio(parent: Object3D, sfxName: string, loop: boolean): number {
        const audio = new PositionalAudio(SoundManager.sceneAudioListener)
        audio.setRefDistance(TILESIZE * 5)
        audio.setRolloffFactor(10)
        const sfxVolume = SaveGameManager.getSfxVolume()
        audio.setVolume(sfxVolume)
        audio.loop = loop
        const audioId = SoundManager.nextAudioId
        SoundManager.playingAudio.set(audioId, audio)
        if (!audio.loop) {
            audio.onEnded = () => {
                parent.remove(audio)
                SoundManager.playingAudio.delete(audioId)
            }
        }
        const audioBuffer = SoundManager.getSoundBuffer(sfxName)
        if (audioBuffer) {
            audio.setBuffer(audioBuffer)
            parent.add(audio)
            if (sfxVolume > 0) audio.play()
        }
        return audioId
    }

    private limitCameraBird() {
        this.tempBirdTargetDelta.copy(this.birdViewControls.target)
        this.birdViewControls.target.clamp(this.cameraMinPos, this.cameraMaxPos)
        this.tempBirdTargetDelta.sub(this.birdViewControls.target)
        this.cameraBird.position.sub(this.tempBirdTargetDelta)
        this.forceCameraBirdAboveFloor()
    }

    private forceCameraBirdAboveFloor() {
        const terrainCheckOrigin = this.cameraBird.getWorldPosition(new Vector3())
        terrainCheckOrigin.y += TILESIZE
        this.raycaster.set(terrainCheckOrigin, new Vector3(0, -1, 0))
        const terrainIntersectionPoint = this.raycaster.intersectObject(this.floorGroup, true)?.[0]?.point
        if (!terrainIntersectionPoint) return
        const minCameraPosY = terrainIntersectionPoint.y + CAMERA_MIN_HEIGHT_ABOVE_TERRAIN + CAMERA_MAX_SHAKE_BUMP
        const centerPosition = this.birdViewControls.target.clone()
        centerPosition.y = 0
        const groundPosition = this.cameraBird.position.clone()
        groundPosition.y = 0
        const origin = new Vector2(this.birdViewControls.target.y, 0)
        const remote = new Vector2(minCameraPosY, centerPosition.distanceTo(groundPosition))
        this.birdViewControls.maxPolarAngle = Math.atan2(remote.y - origin.y, remote.x - origin.x)
    }
}
