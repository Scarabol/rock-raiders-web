import { AbstractSubSystem } from "./AbstractSubSystem"
import { HealthBarSpriteComponent } from "../component/common/HealthBarSpriteComponent"

export class HealthBarSpriteSystem extends AbstractSubSystem<HealthBarSpriteComponent> {
    static readonly STATUS_CHANGE_SPEED = 0.0001
    static readonly HIDE_AFTER_CHANGE_TIMEOUT = 2000
    showOnlyOnChange: boolean = true
    withDirtyStatus: HealthBarSpriteComponent[] = []
    withHideAfterChangeTimeout: HealthBarSpriteComponent[] = []

    constructor() {
        super(HealthBarSpriteComponent)
    }

    update(elapsedMs: number) {
        this.withDirtyStatus.forEach((c) => {
            c.updateStatus(elapsedMs)
            if (c.actualStatus === c.targetStatus) {
                c.hideAfterChangeTimeout = HealthBarSpriteSystem.HIDE_AFTER_CHANGE_TIMEOUT
                this.withHideAfterChangeTimeout.add(c)
            }
        })
        this.withDirtyStatus = this.withDirtyStatus.filter((c) => c.actualStatus !== c.targetStatus)
        this.withHideAfterChangeTimeout.forEach((c) => {
            c.hideAfterChangeTimeout -= elapsedMs
            if (c.hideAfterChangeTimeout <= 0 && this.showOnlyOnChange) {
                c.sprite.visible = false
            }
        })
        this.withHideAfterChangeTimeout = this.withHideAfterChangeTimeout.filter((c) => c.hideAfterChangeTimeout > 0)
    }

    setShowOnlyOnChange(showOnlyOnChange: boolean) {
        this.showOnlyOnChange = showOnlyOnChange
        this.forEachComponent((c) => {
            c.sprite.visible = !this.showOnlyOnChange || c.hideAfterChangeTimeout > 0
        })
    }

    markDirtyStatus(c: HealthBarSpriteComponent) {
        this.withDirtyStatus.add(c)
    }
}
