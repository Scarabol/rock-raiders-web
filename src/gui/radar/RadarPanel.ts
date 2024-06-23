import { ButtonRadarCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { MapView } from './MapView'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { ResourceManager } from '../../resource/ResourceManager'
import { FollowerView } from './FollowerView'

export class RadarPanel extends Panel {
    readonly fill: SpriteImage
    readonly map: MapView
    readonly follower: FollowerView
    readonly btnToggle: Button
    readonly btnMap: Button
    readonly btnTagged: Button
    readonly btnZoomIn: Button
    readonly btnZoomOut: Button
    lastView: BaseElement

    constructor(panelCfg: PanelCfg, panelFillCfg: PanelCfg, panelOverlayCfg: PanelCfg, buttonsCfg: ButtonRadarCfg) {
        super(panelCfg)
        this.fill = ResourceManager.getImage(panelFillCfg.filename)
        this.map = this.addChild(new MapView())
        this.follower = this.addChild(new FollowerView(panelOverlayCfg))
        this.btnToggle = this.addChild(new Button(buttonsCfg.panelButtonRadarToggle))
        this.btnToggle.onClick = () => this.toggleState()
        this.btnMap = this.addChild(new Button(buttonsCfg.panelButtonRadarMapView))
        this.btnMap.onClick = () => {
            this.map.show()
            this.follower.hide()
            this.lastView = this.map
            this.btnZoomIn.hidden = this.map.hidden
            this.btnZoomOut.hidden = this.map.hidden
        }
        this.btnTagged = this.addChild(new Button(buttonsCfg.panelButtonRadarTaggedObjectView))
        this.btnTagged.onClick = () => {
            this.map.hide()
            this.follower.show()
            this.lastView = this.follower
            this.btnZoomIn.hidden = this.map.hidden
            this.btnZoomOut.hidden = this.map.hidden
        }
        this.btnZoomIn = this.addChild(new Button(buttonsCfg.panelButtonRadarZoomIn))
        this.btnZoomIn.onClick = () => this.map.zoomIn()
        this.btnZoomIn.hidden = this.map.hidden
        this.btnZoomOut = this.addChild(new Button(buttonsCfg.panelButtonRadarZoomOut))
        this.btnZoomOut.onClick = () => this.map.zoomOut()
        this.btnZoomOut.hidden = this.map.hidden
    }

    toggleState(onDone: () => any = null) {
        super.toggleState(() => {
            if (!this.movedIn && this.lastView) {
                this.lastView.hidden = false
                if (this.lastView === this.map) {
                    this.btnZoomIn.hidden = this.map.hidden
                    this.btnZoomOut.hidden = this.map.hidden
                }
            }
            if (onDone) onDone()
        })
        if (this.movedIn) {
            this.map.hidden = true
            this.follower.hidden = true
        }
    }

    reset() {
        super.reset()
        this.map.hide()
        this.follower.hide()
        this.lastView = this.map
        this.btnZoomIn.hidden = this.map.hidden
        this.btnZoomOut.hidden = this.map.hidden
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        if (this.fill) context.drawImage(this.fill, this.x, this.y)
        this.map.onRedraw(context)
        this.follower.onRedraw(context)
        if (this.img) context.drawImage(this.img, this.x, this.y)
        this.btnToggle.onRedraw(context)
        this.btnMap.onRedraw(context)
        this.btnTagged.onRedraw(context)
        this.btnZoomIn.onRedraw(context)
        this.btnZoomOut.onRedraw(context)
        this.children.forEach((child) => child.drawHover(context))
    }
}
