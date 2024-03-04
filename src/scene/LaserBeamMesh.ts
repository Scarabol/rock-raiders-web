import { AdditiveBlending, DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three'

class BeamMat extends MeshStandardMaterial {
    constructor(isBlue: boolean) {
        super()
        this.side = DoubleSide
        if (isBlue) {
            this.color.set(0, 0, 1)
            this.opacity = 0.6
        }
        this.blending = AdditiveBlending
        this.depthWrite = false
        this.transparent = true
    }
}

export class LaserBeamMesh extends Group {
    constructor(length: number) {
        super()
        // outer blue beam
        const geoYBlue = new PlaneGeometry(length, 1.6, 1, 1)
        geoYBlue.rotateY(Math.PI / 2)
        geoYBlue.translate(0, 0, length / 2)
        const geoXBlue = new PlaneGeometry(length, 1.6, 1, 1)
        geoXBlue.rotateY(Math.PI / 2)
        geoXBlue.rotateZ(Math.PI / 2)
        geoXBlue.translate(0, 0, length / 2)
        const blueMat = new BeamMat(true)
        this.add(new Mesh(geoYBlue, blueMat))
        this.add(new Mesh(geoXBlue, blueMat))
        // inner white beam
        const geoYWhite = new PlaneGeometry(length, 0.4, 1, 1)
        geoYWhite.rotateY(Math.PI / 2)
        geoYWhite.translate(0, 0, length / 2)
        const geoXWhite = new PlaneGeometry(length, 0.4, 1, 1)
        geoXWhite.rotateY(Math.PI / 2)
        geoXWhite.rotateZ(Math.PI / 2)
        geoXWhite.translate(0, 0, length / 2)
        const whiteMat = new BeamMat(false)
        this.add(new Mesh(geoYWhite, whiteMat))
        this.add(new Mesh(geoXWhite, whiteMat))
    }
}
