import { PerspectiveCamera } from "three"
import { CAMERA_FOV, CAMERA_MAX_DISTANCE } from "../params"

export class BirdViewCamera extends PerspectiveCamera {
    constructor(aspect: number) {
        super(CAMERA_FOV, aspect, 0.1, CAMERA_MAX_DISTANCE)
    }
}
