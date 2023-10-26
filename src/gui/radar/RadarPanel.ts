import { ButtonRadarCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { MapPanel } from './MapPanel'
import { SpriteContext } from '../../core/Sprite'

export class RadarPanel extends Panel {
    readonly map: MapPanel
    readonly fill: Panel
    readonly overlay: Panel
    readonly btnToggle: Button
    readonly btnMap: Button
    readonly btnTagged: Button
    readonly btnZoomIn: Button
    readonly btnZoomOut: Button

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
            this.btnZoomIn.hidden = this.map.hidden
            this.btnZoomOut.hidden = this.map.hidden
        }
        this.btnTagged = this.addChild(new Button(this, buttonsCfg.panelButtonRadarTaggedObjectView))
        this.btnTagged.onClick = () => {
            this.fill.show()
            // this.overlay.show() // TODO only show overlay, when entity selected
            this.map.hide()
            this.btnZoomIn.hidden = this.map.hidden
            this.btnZoomOut.hidden = this.map.hidden
        }
        this.btnZoomIn = this.addChild(new Button(this, buttonsCfg.panelButtonRadarZoomIn))
        this.btnZoomIn.onClick = () => this.map.zoomIn()
        this.btnZoomIn.hidden = this.map.hidden
        this.btnZoomOut = this.addChild(new Button(this, buttonsCfg.panelButtonRadarZoomOut))
        this.btnZoomOut.onClick = () => this.map.zoomOut()
        this.btnZoomOut.hidden = this.map.hidden
    }

    reset() {
        super.reset()
        this.map.show()
        this.fill.hide()
        this.overlay.hide()
        this.btnZoomIn.hidden = this.map.hidden
        this.btnZoomOut.hidden = this.map.hidden
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        this.map.onRedraw(context)
        this.fill.onRedraw(context)
        this.overlay.onRedraw(context)
        if (this.img) context.drawImage(this.img, this.x, this.y)
        this.btnToggle.onRedraw(context)
        this.btnMap.onRedraw(context)
        this.btnTagged.onRedraw(context)
        this.btnZoomIn.onRedraw(context)
        this.btnZoomOut.onRedraw(context)
        this.children.forEach((child) => child.drawHover(context))
    }
}
