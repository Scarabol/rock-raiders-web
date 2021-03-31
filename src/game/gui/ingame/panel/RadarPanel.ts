import { Button } from '../../base/button/Button'
import { iGet } from '../../../../core/Util'
import { Panel } from './Panel'

export class RadarPanel extends Panel {

    fill: Panel
    overlay: Panel
    btnToggle: Button
    btnMap: Button
    btnTagged: Button

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg)
        this.fill = this.addChild(new Panel('Panel_RadarFill', panelsCfg, buttonsCfg))
        // fill cords given in abs, turn to rel (otherwise animation wont work)
        this.fill.relX = this.relX - this.fill.relX
        this.fill.relY = this.relY - this.fill.relY
        this.overlay = this.addChild(new Panel('Panel_RadarOverlay', panelsCfg, buttonsCfg))
        // this.overlay.hide();
        this.btnToggle = iGet(this.buttons, 'PanelButton_Radar_Toggle')
        this.btnToggle.onClick = () => this.toggleState()
        this.btnMap = iGet(this.buttons, 'PanelButton_Radar_MapView')
        this.btnMap.onClick = () => {
            // this.fill.hide();
            // this.overlay.hide();
        }
        this.btnTagged = iGet(this.buttons, 'PanelButton_Radar_TaggedObjectView')
        this.btnTagged.onClick = () => {
            // this.fill.show();
            // this.overlay.show(); // TODO only show overlay, when entity selected
        }
    }

}
