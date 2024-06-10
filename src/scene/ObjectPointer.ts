import { Object3D, Sprite, SpriteMaterial } from 'three'
import { TILESIZE } from '../params'
import { Updatable } from '../game/model/Updateable'
import { ResourceManager } from '../resource/ResourceManager'
import { GameConfig } from '../cfg/GameConfig'

export class ObjectPointer extends Sprite implements Updatable {
    static readonly HEIGHT_OFFSET_STATIC: number = TILESIZE
    static readonly HEIGHT_OFFSET_AMPLITUDE: number = TILESIZE / 4

    heightOffset: number = ObjectPointer.HEIGHT_OFFSET_STATIC
    timer: number = 0

    constructor() {
        super(new SpriteMaterial(({map: ResourceManager.getTexture(GameConfig.instance.main.tutorialIcon), depthTest: false})))
        this.scale.setScalar(15)
        this.visible = false
    }

    update(elapsedMs: number) {
        if (!this.visible) return
        this.timer = (this.timer + elapsedMs / 120) % (2 * Math.PI)
        this.position.y = this.heightOffset + Math.sin(this.timer) * ObjectPointer.HEIGHT_OFFSET_AMPLITUDE
    }

    setTargetObject(target: Object3D) {
        target.add(this)
        this.show()
    }

    private show() {
        this.timer = 0
        this.position.y = this.heightOffset
        this.visible = true
    }

    hide() {
        this.visible = false
    }
}
