import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
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

export class ButtonRadarCfg extends BaseConfig {

    panelButtonRadarToggle: ButtonCfg = null
    panelButtonRadarTaggedObjectView: ButtonCfg = null
    panelButtonRadarZoomIn: ButtonCfg = null
    panelButtonRadarZoomOut: ButtonCfg = null
    panelButtonRadarMapView: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }

}
