import { Mesh, MeshPhongMaterial, Vector3 } from 'three'
import { SurfaceGeometry } from '../map/SurfaceGeometry'
import { WALL_TYPE } from '../map/WallType'

export class BuildPlacementMarkerMesh extends Mesh {

    static readonly geometry = SurfaceGeometry.create(WALL_TYPE.WALL, new Vector3(0, 0, 0), new Vector3(1, 0, 1),
        new Vector3(1, 0, 0), new Vector3(0, 0, 1),
        1, 1, 1, 1,
    )

    standardColor: number

    constructor(standardColor: number) {
        super(BuildPlacementMarkerMesh.geometry, new MeshPhongMaterial({
            shininess: 0,
            transparent: true,
            opacity: 0.4,
            color: standardColor,
        }))
        this.standardColor = standardColor
        this.visible = false
    }

    updateState(position: { x: number, y: number }, heading: number, primaryPosition: Vector3) {
        this.visible = !!position
        if (position) {
            this.position.set(position.x, 0, position.y)
                .applyAxisAngle(new Vector3(0, 1, 0), -heading - Math.PI / 2)
                .add(primaryPosition)
        }
    }

    markAsValid(isValid: boolean) {
        const color = isValid ? this.standardColor : 0x500000;
        (this.material as MeshPhongMaterial).color.setHex(color)
    }

}
