import { AxesHelper, Group, Object3D, PerspectiveCamera, PositionalAudio, Raycaster, Scene, Sprite, Vector2, Vector3 } from 'three'
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
import { CAMERA_FOV, CAMERA_MAX_DYNAMITE_SHAKE_DISTANCE, CAMERA_MIN_HEIGHT_ABOVE_TERRAIN, DEV_MODE, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SoundManager } from '../audio/SoundManager'
import { SceneEntity } from './SceneEntity'
import { AnimationGroup } from '../scene/AnimationGroup'
import { createCanvas } from '../core/ImageHelper'
import { FollowerRenderer } from '../scene/FollowerRenderer'
import { EventKey } from '../event/EventKeyEnum'
import { LeveledAmbientLight } from '../scene/LeveledAmbientLight'
import { EventBroker } from '../event/EventBroker'

export class SceneManager implements Updatable {
    static readonly VEC_DOWN: Vector3 = new Vector3(0, -1, 0)
    readonly scene: Scene
    readonly cameraBird: BirdViewCamera
    readonly cameraShoulder: PerspectiveCamera
    readonly cameraFPV: PerspectiveCamera
    readonly renderer: SceneRenderer
    readonly birdViewControls: BirdViewControls
    readonly sceneObjects: SceneEntity[] = []
    readonly sprites: (Sprite & Updatable)[] = []
    readonly lastCameraWorldPos: Vector3 = new Vector3()
    readonly raycaster: Raycaster = new Raycaster()
    ambientLight: LeveledAmbientLight
    terrain: Terrain
    floorGroup: Group
    torchLightCursor: TorchLightCursor
    buildMarker: BuildPlacementMarker
    followerRenderer: FollowerRenderer
    shakeTimeout: number = 0
    bumpTimeout: number = 0
    cameraActive: PerspectiveCamera

    constructor(readonly worldMgr: WorldManager, canvas: HTMLCanvasElement) {
        this.worldMgr.sceneMgr = this
        this.scene = new Scene()
        const aspect = canvas.width / canvas.height
        this.cameraBird = new BirdViewCamera(aspect)
        this.cameraShoulder = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 8 * TILESIZE)
        this.cameraFPV = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 8 * TILESIZE)
        this.renderer = new SceneRenderer(canvas)
        this.birdViewControls = new BirdViewControls(this.cameraBird, canvas)
        if (!DEV_MODE) this.birdViewControls.addEventListener('change', () => this.forceCameraBirdAboveFloor())
        this.setActiveCamera(this.cameraBird)
        EventBroker.subscribe(EventKey.DYNAMITE_EXPLOSION, () => {
            this.shakeTimeout = 1000
            this.bumpTimeout = 0
        })
        EventBroker.subscribe(EventKey.SELECTION_CHANGED, () => {
            this.setActiveCamera(this.cameraBird) // TODO Only reset camera, when camera parent is affected
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            this.ambientLight?.setLightLevel(SaveGameManager.currentPreferences.gameBrightness)
        })
    }

    setActiveCamera(camera: PerspectiveCamera) {
        const isBirdView = camera === this.cameraBird
        if (this.torchLightCursor) this.torchLightCursor.visible = isBirdView
        this.birdViewControls.disabled = !isBirdView
        this.cameraActive = camera
        this.cameraActive.add(SoundManager.sceneAudioListener)
        this.renderer.camera = camera
    }

    setupScene(levelConf: LevelConfData) {
        this.scene.clear()
        this.ambientLight = new LeveledAmbientLight()
        this.ambientLight.setLightLevel(SaveGameManager.currentPreferences.gameBrightness)
        this.scene.add(this.ambientLight)

        this.torchLightCursor = new TorchLightCursor()
        this.scene.add(this.torchLightCursor)
        this.birdViewControls.unlockCamera()
        this.birdViewControls.addEventListener('change', this.torchLightCursor.changeListener)

        this.buildMarker = new BuildPlacementMarker(this.worldMgr)
        this.scene.add(this.buildMarker.group)
        this.setBuildModeSelection(null)

        this.floorGroup = new Group()
        this.floorGroup.scale.setScalar(TILESIZE)
        if (DEV_MODE) this.floorGroup.add(new AxesHelper())
        this.terrain = TerrainLoader.loadTerrain(levelConf, this.worldMgr)
        this.terrain.forEachSurface((s) => {
            this.floorGroup.add(s.mesh)
        })
        this.scene.add(this.floorGroup)

        const followerCanvas = createCanvas(158, 158)
        this.followerRenderer = new FollowerRenderer(followerCanvas, this.scene, this.worldMgr.ecs)
    }

    async startScene(): Promise<void> {
        return this.renderer.startRendering(this.scene)
    }

    update(elapsedMs: number) {
        this.sceneObjects.forEach((e) => updateSafe(e, elapsedMs))
        this.sprites.forEach((s) => updateSafe(s, elapsedMs))
        updateSafe(this.torchLightCursor, elapsedMs)
        this.birdViewControls?.updateControlsSafe(elapsedMs)
        this.shakeScene(elapsedMs)
    }

    private shakeScene(elapsedMs: number) {
        if (this.shakeTimeout <= 0) return
        this.shakeTimeout -= elapsedMs
        this.bumpTimeout += elapsedMs
        if (this.bumpTimeout > NATIVE_UPDATE_INTERVAL) {
            this.scene.position.random().multiplyScalar(CAMERA_MAX_DYNAMITE_SHAKE_DISTANCE)
            this.bumpTimeout = 0
        }
        if (this.shakeTimeout <= 0) {
            this.shakeTimeout = 0
            this.bumpTimeout = 0
            this.scene.position.setScalar(0)
        }
    }

    disposeScene() {
        this.scene.clear()
        this.renderer.stopRendering()
        this.followerRenderer?.stopRendering()
        GameState.remainingDiggables = this.terrain?.countDiggables() || 0
        this.terrain?.dispose()
        this.terrain = null
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

    setBuildModeSelection(entityType: EntityType) {
        this.buildMarker.setBuildMode(entityType)
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
        const group = new AnimationGroup(lwsFilename, loop ? null : () => {
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

    addPositionalAudio(parent: Object3D, sfxName: string, autoPlay: boolean, loop: boolean): PositionalAudio {
        const audio = new PositionalAudio(SoundManager.sceneAudioListener)
        audio.setRefDistance(TILESIZE * 5)
        audio.setRolloffFactor(10)
        const sfxVolume = SaveGameManager.getSfxVolume()
        audio.setVolume(sfxVolume)
        audio.loop = loop
        SoundManager.playingAudio.add(audio)
        if (!audio.loop) {
            audio.onEnded = () => {
                parent.remove(audio)
                SoundManager.playingAudio.delete(audio)
            }
        }
        const audioBuffer = SoundManager.getSoundBuffer(sfxName)
        if (audioBuffer) {
            audio.setBuffer(audioBuffer)
            parent.add(audio)
            if (autoPlay && sfxVolume > 0) audio.play()
        }
        return audio
    }

    private forceCameraBirdAboveFloor() {
        this.cameraBird.getWorldPosition(this.lastCameraWorldPos)
        this.lastCameraWorldPos.y += TILESIZE
        this.raycaster.set(this.lastCameraWorldPos, SceneManager.VEC_DOWN)
        const terrainIntersectionPoint = this.raycaster.intersectObject(this.floorGroup, true)?.[0]?.point
        if (!terrainIntersectionPoint) return
        const minCameraPosY = terrainIntersectionPoint.y + CAMERA_MIN_HEIGHT_ABOVE_TERRAIN + CAMERA_MAX_DYNAMITE_SHAKE_DISTANCE
        const centerPosition = this.birdViewControls.target.clone()
        centerPosition.y = 0
        const groundPosition = this.cameraBird.position.clone()
        groundPosition.y = 0
        const origin = new Vector2(this.birdViewControls.target.y, 0)
        const remote = new Vector2(minCameraPosY, centerPosition.distanceTo(groundPosition))
        this.birdViewControls.maxPolarAngle = Math.atan2(remote.y - origin.y, remote.x - origin.x)
    }
}
