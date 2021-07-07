import { modulus } from "../math/math"
import Vector from "../math/Vector"
type SupportFunction = ( v: Vector ) => Vector
export default SupportFunction

export function polygonSupport( poly: Vector[] ): SupportFunction {
    return ( axis: Vector ) => {
        let best = poly[ 0 ]
        let bestDist = best.dot( axis )
        for ( let i = 1; i < poly.length; i++ ) {
            let next = poly[ i ]
            let nextDist = next.dot( axis )
            if ( nextDist > bestDist )
                best = next, bestDist = nextDist
        }
        return best
    }
}