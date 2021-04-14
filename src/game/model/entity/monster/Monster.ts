import { MovableEntity } from '../../../../scene/model/MovableEntity'

export abstract class Monster extends MovableEntity {

    abstract onLevelEnd()

}
