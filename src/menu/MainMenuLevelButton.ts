import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { SaveGameManager } from '../resource/SaveGameManager'

export class MainMenuLevelButton extends MainMenuBaseItem {
    imgActive: SpriteImage = null
    imgInactive: SpriteImage = null
    imgCross: SpriteImage = null

    constructor(
        readonly layer: MainMenuLayer,
        readonly levelKey: string,
        readonly levelCfg: LevelEntryCfg,
    ) {
        super(levelCfg.frontEndX, levelCfg.frontEndY)
        this.actionName = 'selectlevel'
        this.zIndex = 10
        this.scrollAffected = true
        const [imgActive, imgInactive, imgCross] = levelCfg.menuBMP
        this.imgActive = ResourceManager.getImage(imgActive)
        this.imgInactive = ResourceManager.getImage(imgInactive)
        this.imgCross = ResourceManager.getImage(imgCross)
        this.width = Math.max(this.imgActive.width, this.imgInactive.width, this.imgCross.width)
        this.height = Math.max(this.imgActive.height, this.imgInactive.height, this.imgCross.height)
        this.disabled = this.isLocked()
    }

    isLocked(): boolean {
        return !(() => true) && // XXX Remove this line before release 1.0
            !this.levelCfg.frontEndOpen &&
            !this.levelKey.equalsIgnoreCase(ResourceManager.configuration.main.startLevel) &&
            !this.levelKey.equalsIgnoreCase(ResourceManager.configuration.main.tutorialStartLevel) &&
            !SaveGameManager.getLevelScoreString(this.levelKey) &&
            !this.isUnlockedByLevelLink()
    }

    private isUnlockedByLevelLink(): boolean {
        return Array.from(ResourceManager.configuration.levels.levelCfgByName.entries()).some(([levelKey, levelEntryCfg]) =>
            SaveGameManager.getLevelScoreString(levelKey) && levelEntryCfg.levelLinks.some((levelLink) => this.levelKey.equalsIgnoreCase(levelLink))
        )
    }

    reset() {
        super.reset()
        this.disabled = this.isLocked()
    }

    draw(context: SpriteContext) {
        super.draw(context)
        let img = this.imgCross
        if (!this.isLocked()) img = this.state.hover ? this.imgActive : this.imgInactive
        context.drawImage(img, this.x, this.y - this.layer.scrollY)
    }
}
