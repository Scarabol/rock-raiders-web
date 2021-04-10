import { Panel } from '../base/Panel'
import { MenuLayer } from './MenuLayer'
import { MenuCfg } from '../../../cfg/MenuCfg'
import { ScaledLayer } from '../../../screen/ScreenLayer'

export class MenuBasePanel extends Panel {

    layersByKey: Map<string, MenuLayer> = new Map()

    constructor(layer: ScaledLayer, cfg: MenuCfg) {
        super()
        this.width = layer.fixedWidth
        this.height = layer.fixedHeight
        this.hidden = true
        cfg.menus.forEach((menuCfg, index) => this.layersByKey.set('menu' + (index + 1), this.addChild(new MenuLayer(this, menuCfg))))
        const pausePanel = this
        this.layersByKey.forEach((layer) => layer.itemsNext.forEach((item) => item.onClick = () => pausePanel.selectLayer(item.target)))
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
