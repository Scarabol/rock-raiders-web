import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { BuildingActivity } from '../../game/model/activities/BuildingActivity'
import { SceneManager } from '../../game/SceneManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { BubbleSprite } from '../BubbleSprite'

export class BuildingSceneEntity extends AnimatedSceneEntity {
    inBeam: boolean = false
    powered: boolean = false
    powerBubble: BubbleSprite = new BubbleSprite(ResourceManager.configuration.bubbles.bubblePowerOff)

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr, aeFilename)
        this.flipXAxis()
        this.addUpdatable(this.powerBubble)
    }

    setInBeam(state: boolean) {
        this.inBeam = state
        this.powerBubble.setEnabled(!this.inBeam && !this.powered)
    }

    setPowered(state: boolean) {
        if (this.powered === state) return
        this.powered = state
        this.powerBubble.setEnabled(!this.inBeam && !this.powered)
        this.changeActivity()
    }

    getDefaultActivity(): BuildingActivity {
        return !this.powered ? BuildingActivity.Unpowered : AnimEntityActivity.Stand
    }
}
