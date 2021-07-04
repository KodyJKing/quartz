import { modulus } from "../math/math"
import Vector from "../math/Vector"
type SupportFunction = ( v: Vector ) => Vector
export default SupportFunction

// export function polygonSupport( poly: Vector[] ): SupportFunction {
//     return ( axis: Vector ) => {
//         let best = poly[ 0 ]
//         let bestDist = best.dot( axis )
//         for ( let i = 1; i < poly.length; i++ ) {
//             let next = poly[ i ]
//             let nextDist = next.dot( axis )
//             if ( nextDist > bestDist )
//                 best = next, bestDist = nextDist
//         }
//         return best
//     }
// }

export function polygonSupport( poly: Vector[] ): SupportFunction {
    let i = 0, length = poly.length
    return ( axis: Vector ) => {
        let dist = poly[ i ].dot( axis )
        let nextDist = 0
        let j = i
        while ( dist < ( nextDist = poly[ i = ++i % length ].dot( axis ) ) )
            dist = nextDist, j = i
        i = j
        while ( dist < ( nextDist = poly[ i = modulus( --i, length ) ].dot( axis ) ) )
            dist = nextDist, j = i
        i = j
        return poly[ i ]
    }
}