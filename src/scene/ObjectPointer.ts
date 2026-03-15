import { Object3D, Sprite, SpriteMaterial } from 'three'
import { TILESIZE } from '../params'
import { Updatable } from '../game/model/Updateable'
import { ResourceManager } from '../resource/ResourceManager'
import { GameConfig } from '../cfg/GameConfig'
import { SurfaceMesh } from '../game/terrain/SurfaceMesh'

export class ObjectPointer extends Object3D implements Updatable {
    static readonly HEIGHT_OFFSET_AMPLITUDE: number = TILESIZE / 4

    readonly sprite: Sprite
    timer: number = 0
    surfaceMesh: SurfaceMesh | undefined

    constructor() {
        super()
        this.sprite = new Sprite(new SpriteMaterial(({ map: ResourceManager.getTexture(GameConfig.instance.main.tutorialIcon) ?? null, depthTest: false })))
        this.sprite.scale.setScalar(15)
        this.add(this.sprite)
        this.visible = false
    }

    update(elapsedMs: number) {
        if (!this.visible) return
        this.timer = (this.timer + elapsedMs / 120) % (2 * Math.PI)
        this.sprite.position.y = TILESIZE + Math.sin(this.timer) * ObjectPointer.HEIGHT_OFFSET_AMPLITUDE
        this.surfaceMesh?.setHighlightColor(this.timer < Math.PI ? 0xa0a000 : 0xffffff)
    }

    showOnObject(target: Object3D) {
        target.add(this)
        this.position.setScalar(0)
        this.show()
    }

    show() {
        this.timer = 0
        this.visible = true
    }

    hide() {
        this.visible = false
        this.surfaceMesh?.setHighlightColor(0xffffff)
    }
}
