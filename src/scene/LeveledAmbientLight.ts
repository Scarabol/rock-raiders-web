import { AmbientLight } from 'three'
import { GameConfig } from '../cfg/GameConfig'
import { ColorRGB } from './ColorRGB'

export class LeveledAmbientLight extends AmbientLight {
    constructor() {
        super(new ColorRGB(GameConfig.instance.main.ambientRGB))
    }

    setLightLevel(lightLevel: number) {
        this.intensity = 0.05 + Math.max(0, Math.min(1, lightLevel)) * 0.45
    }
}
