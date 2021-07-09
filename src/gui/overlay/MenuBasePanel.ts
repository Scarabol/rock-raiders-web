import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { MenuLayer } from './MenuLayer'

export class MenuBasePanel extends Panel {

    layersByKey: Map<string, MenuLayer> = new Map()

    constructor(parent: BaseElement, cfg: MenuCfg) {
        super(parent)
        this.hidden = true
        cfg.menus.forEach((menuCfg, index) => this.layersByKey.set(`menu${index + 1}`, this.addChild(new MenuLayer(this, menuCfg))))
        this.layersByKey.forEach((layer) => layer.itemsNext.forEach((item) => item.onClick = () => this.selectLayer(item.target)))
    }

    reset() {
        super.reset()
        this.hidden = true
    }

    show() {
        this.hidden = false
        this.selectLayer('menu1')
    }

    hide() {
        super.hide()
        this.notifyRedraw()
    }

    selectLayer(key: string) {
        const layer = this.layersByKey.get(key.toLowerCase())
        this.layersByKey.forEach(l => l !== layer && l.hide())
        layer.show()
        this.notifyRedraw()
    }

}
