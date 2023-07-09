import { AbstractGameComponent } from '../ECS'

export class LastWillComponent extends AbstractGameComponent {
    constructor(readonly onDeath: () => void) {
        super()
    }
}
