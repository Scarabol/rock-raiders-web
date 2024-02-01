import { CanvasTexture, Sprite, SpriteMaterial } from 'three'
import { createContext } from '../core/ImageHelper'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'

export class HealthFontSprite extends Sprite {
    static readonly textureSize = 64
    readonly textureContext: SpriteContext
    state: number = 0

    constructor(readonly yOffset: number, readonly startScale: number) {
        super(new SpriteMaterial({depthTest: false}))
        this.position.set(0, yOffset, 0)
        this.scale.setScalar(startScale)
        this.textureContext = createContext(HealthFontSprite.textureSize, HealthFontSprite.textureSize)
        this.material.map = new CanvasTexture(this.textureContext.canvas as HTMLCanvasElement)
    }

    setNumber(healthNumber: number) {
        healthNumber = Math.round(Math.max(-100, Math.min(healthNumber, 100)))
        this.state = 0
        this.textureContext.clearRect(0, 0, HealthFontSprite.textureSize, HealthFontSprite.textureSize)
        const numStr = healthNumber.toString()
        const numImg: SpriteImage[] = []
        let totalWidth: number = 0
        for (let c = 0; c < numStr.length; c++) {
            const letter = numStr.charAt(c)
            let img: SpriteImage
            if (letter.match(/^\d$/)) {
                img = ResourceManager.getImage(`Interface/Fonts/HealthFont/a000_${letter}.bmp`)
            } else if (letter === '-') {
                img = ResourceManager.getImage('Interface/Fonts/HealthFont/a000_10.bmp')
            } else {
                console.warn('Ignoring invalid char in health font', letter)
                continue
            }
            numImg.push(img)
            totalWidth += img.width
        }
        let x = (HealthFontSprite.textureSize - totalWidth) / 2
        numImg.forEach((img) => {
            this.textureContext.drawImage(img, x, (HealthFontSprite.textureSize - img.height) / 2)
            x += img.width
        })
        this.material.map.needsUpdate = true
        const r = healthNumber < 0 ? 255 : 0
        const g = Math.max(0, Math.min((100 + healthNumber) / 50 * 255, 255))
        this.material.color.setRGB(r, g, 0)
    }

    update(elapsedMs: number) {
        if (this.state >= 1) return
        this.state += elapsedMs / 1000
        if (this.state > 1) this.state = 1
        this.material.opacity = 1 - this.state
        this.position.y = this.yOffset + this.state * this.yOffset * 2
        this.scale.setScalar(this.startScale * this.state * 2)
    }
}
