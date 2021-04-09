import { Panel } from '../base/Panel'
import { MenuLayer } from './MenuLayer'
import { GuiLayer } from '../../layer/GuiLayer'
import { MenuCfg } from '../../../cfg/MenuCfg'

export class MenuBasePanel extends Panel {

    layersByKey: Map<string, MenuLayer> = new Map()

    constructor(guiLayer: GuiLayer, cfg: MenuCfg) {
        super()
        this.width = guiLayer.fixedWidth
        this.height = guiLayer.fixedHeight
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
