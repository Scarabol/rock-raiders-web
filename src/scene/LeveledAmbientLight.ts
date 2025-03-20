import { AmbientLight, Color } from 'three'
import { GameConfig } from '../cfg/GameConfig'

export class LeveledAmbientLight extends AmbientLight {
    constructor() {
        super(new Color().fromArray(GameConfig.instance.main.ambientRGB))
    }

    setLightLevel(lightLevel: number) {
        this.intensity = 1.25 + Math.max(0, Math.min(1, lightLevel)) * 11.25
    }
}
