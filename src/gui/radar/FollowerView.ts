import { BaseElement } from '../base/BaseElement'
import { PanelCfg } from '../../cfg/PanelCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { clearIntervalSafe } from '../../core/Util'
import { FollowerSetCanvasEvent } from '../../event/LocalEvents'
import { EventKey } from '../../event/EventKeyEnum'
import { ResourceManager } from '../../resource/ResourceManager'
import { EventBroker } from '../../event/EventBroker'
import { BaseEvent } from '../../event/EventTypeMap'

export class FollowerView extends BaseElement {
    readonly overlay: SpriteImage
    renderInterval?: NodeJS.Timeout
    followerCanvas?: SpriteImage

    constructor(panelCfg: PanelCfg) {
        super()
        this.relX = panelCfg.xIn
        this.relY = panelCfg.yIn
        this.overlay = ResourceManager.getImage(panelCfg.filename)
        this.registerEventListener(EventKey.FOLLOWER_SET_CANVAS, (event: FollowerSetCanvasEvent) => {
            this.followerCanvas = event.canvas
        })
    }

    show() {
        super.show()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.renderInterval = setInterval(() => {
            if (this.followerCanvas) this.notifyRedraw()
        })
        EventBroker.publish(new BaseEvent(EventKey.FOLLOWER_RENDER_START))
    }

    hide() {
        super.hide()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        EventBroker.publish(new BaseEvent(EventKey.FOLLOWER_RENDER_STOP))
    }

    reset() {
        super.reset()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        EventBroker.publish(new BaseEvent(EventKey.FOLLOWER_RENDER_STOP))
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        if (this.followerCanvas) {
            context.drawImage(this.followerCanvas, this.x - 8, this.y - 2)
            if (this.overlay) context.drawImage(this.overlay, this.x + 4, this.y - 2)
        }
    }
}
