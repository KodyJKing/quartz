import { equals } from "./math"
import Vector from "./Vector"

export default class Geometry {
    static intersect( na: Vector, distA: number, nb: Vector, distB: number ) {
        // find v where na dot v = distA and nb dot v = distB
        // or
        // |nax nay||vx|   |distA|
        // |nbx nby||vy| = |distB|

        // Solution via Cramer's rule
        let det = na.x * nb.y - nb.x * na.y
        let invDet = 1 / det
        if ( !isFinite( invDet ) )
            return undefined
        let v = new Vector(
            ( distA * nb.y - distB * na.y ) * invDet,
            ( na.x * distB - nb.x * distA ) * invDet
        )

        return v
    }
}