import { ButtonRadarCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { SpriteContext } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { MapPanel } from './MapPanel'

export class RadarPanel extends Panel {
    map: MapPanel
    fill: Panel
    overlay: Panel
    btnToggle: Button
    btnMap: Button
    btnTagged: Button

    // TODO 3D view has no sound and can render scene camera offscreen

    constructor(parent: BaseElement, panelCfg: PanelCfg, panelFillCfg: PanelCfg, panelOverlayCfg: PanelCfg, buttonsCfg: ButtonRadarCfg) {
        super(parent, panelCfg)
        this.map = this.addChild(new MapPanel(this))
        this.fill = this.addChild(new Panel(this, panelFillCfg))
        this.fill.xIn = 0
        this.fill.yIn = 0
        this.fill.xOut = 0
        this.fill.yOut = 0
        this.fill.updatePosition()
        this.overlay = this.addChild(new Panel(this, panelOverlayCfg))
        this.btnToggle = this.addChild(new Button(this, buttonsCfg.panelButtonRadarToggle))
        this.btnToggle.onClick = () => this.toggleState()
        this.btnMap = this.addChild(new Button(this, buttonsCfg.panelButtonRadarMapView))
        this.btnMap.onClick = () => {
            this.fill.hide()
            this.overlay.hide()
            this.map.show()
        }
        this.btnTagged = this.addChild(new Button(this, buttonsCfg.panelButtonRadarTaggedObjectView))
        this.btnTagged.onClick = () => {
            this.fill.show()
            // this.overlay.show() // TODO only show overlay, when entity selected
            this.map.hide()
        }
    }

    reset() {
        super.reset()
        this.map.show()
        this.fill.hide()
        this.overlay.hide()
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        this.map.onRedraw(context)
        this.map.hidden = true // TODO refactor workaround add z layering to panels
        super.onRedraw(context)
        this.map.hidden = false
    }
}
