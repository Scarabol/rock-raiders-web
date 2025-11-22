import { MenuCfg } from '../../cfg/MenuCfg'
import { Panel } from '../base/Panel'
import { MenuLayer } from './MenuLayer'

export class MenuBasePanel extends Panel {
    layersByKey: Map<string, MenuLayer> = new Map()

    constructor(cfg: MenuCfg) {
        super()
        this.hidden = true
        cfg.menus.forEach((menuCfg, index) => this.layersByKey.set(`menu${index + 1}`, this.addChild(new MenuLayer(menuCfg))))
        this.layersByKey.forEach((layer) => layer.itemsNext.forEach((item) => item.onClick = () => this.selectLayer(item.target)))
    }

    override reset() {
        super.reset()
        this.hidden = true
    }

    override show() {
        this.hidden = false
        this.selectLayer('menu1')
    }

    override hide() {
        super.hide()
        this.notifyRedraw()
    }

    selectLayer(key: string) {
        const layer = this.layersByKey.get(key.toLowerCase())
        if (!layer) {
            console.error(`Could not find layer with key "${key}"`)
            return
        }
        this.layersByKey.forEach(l => l !== layer && l.hide())
        layer.show()
        this.notifyRedraw()
    }
}
