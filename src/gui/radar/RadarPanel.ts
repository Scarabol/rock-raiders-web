import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelsCfg'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'

export class RadarPanel extends Panel {

    fill: Panel
    overlay: Panel
    btnToggle: Button
    btnMap: Button
    btnTagged: Button

    constructor(panelCfg: PanelCfg, panelFillCfg: PanelCfg, panelOverlayCfg: PanelCfg, buttonsCfg: ButtonRadarCfg) {
        super(panelCfg)
        this.fill = this.addChild(new Panel(panelFillCfg))
        // fill cords given in abs, turn to rel (otherwise animation wont work)
        this.fill.relX = this.relX - this.fill.relX
        this.fill.relY = this.relY - this.fill.relY
        this.overlay = this.addChild(new Panel(panelOverlayCfg))
        // this.overlay.hide();
        this.btnToggle = this.addChild(new Button(this, buttonsCfg.panelButtonRadarToggle))
        this.btnToggle.onClick = () => this.toggleState()
        this.btnMap = this.addChild(new Button(this, buttonsCfg.panelButtonRadarMapView))
        this.btnMap.onClick = () => {
            // this.fill.hide();
            // this.overlay.hide();
        }
        this.btnTagged = this.addChild(new Button(this, buttonsCfg.panelButtonRadarTaggedObjectView))
        this.btnTagged.onClick = () => {
            // this.fill.show();
            // this.overlay.show(); // TODO only show overlay, when entity selected
        }
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
