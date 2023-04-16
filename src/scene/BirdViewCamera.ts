import { PerspectiveCamera, Raycaster, Vector2 } from 'three'
import { CAMERA_FOV, CAMERA_MAX_DISTANCE } from '../params'

export class BirdViewCamera extends PerspectiveCamera {
    private readonly rayOrigin = new Vector2()

    constructor(aspect: number) {
        super(CAMERA_FOV, aspect, 0.1, CAMERA_MAX_DISTANCE)
    }

    createRaycaster(origin: {x: number, y: number}): Raycaster {
        this.rayOrigin.set(origin.x, origin.y)
        const raycaster = new Raycaster()
        raycaster.setFromCamera(this.rayOrigin, this)
        return raycaster
    }
}
