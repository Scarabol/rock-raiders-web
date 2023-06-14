import { AbstractGameComponent } from '../ECS'

export class OxygenComponent extends AbstractGameComponent {
    constructor(readonly oxygenCoefficient: number) {
        super()
    }
}
