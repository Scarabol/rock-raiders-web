import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { ButtonCfg } from '../../../cfg/ButtonsCfg'

export class InterfaceBackButton extends Button {

    constructor(parent: BaseElement, btnCfg: ButtonCfg) {
        super(parent, btnCfg)
        this.relX = 4
        this.relY = 14
    }

}
