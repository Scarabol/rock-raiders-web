import { ButtonRadarCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { MapPanel } from './MapPanel'

export class RadarPanel extends Panel {
    map: MapPanel
    fill: Panel
    overlay: Panel

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
        const btnToggle = this.addChild(new Button(this, buttonsCfg.panelButtonRadarToggle))
        btnToggle.onClick = () => this.toggleState()
        const btnMap = this.addChild(new Button(this, buttonsCfg.panelButtonRadarMapView))
        btnMap.onClick = () => {
            this.fill.hide()
            this.overlay.hide()
            this.map.show()
        }
        const btnTagged = this.addChild(new Button(this, buttonsCfg.panelButtonRadarTaggedObjectView))
        btnTagged.onClick = () => {
            this.fill.show()
            // this.overlay.show() // TODO only show overlay, when entity selected
            this.map.hide()
        }
        const btnZoomIn = this.addChild(new Button(this, buttonsCfg.panelButtonRadarZoomIn))
        btnZoomIn.onClick = () => this.map.zoomIn()
        const btnZoomOut = this.addChild(new Button(this, buttonsCfg.panelButtonRadarZoomOut))
        btnZoomOut.onClick = () => this.map.zoomOut()
    }

    reset() {
        super.reset()
        this.map.show()
        this.fill.hide()
        this.overlay.hide()
    }
}
