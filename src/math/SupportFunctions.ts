import Matrix from "./Matrix"
import Vector from "./Vector"

export type SupportFunction = ( v: Vector ) => Vector

const SupportFunctions = {
    polygon: ( poly: Vector[] ) => ( axis: Vector ) => {
        let best = poly[ 0 ]
        let bestDist = best.dot( axis )
        for ( let i = 1; i < poly.length; i++ ) {
            let next = poly[ i ]
            let nextDist = next.dot( axis )
            if ( nextDist > bestDist )
                best = next, bestDist = nextDist
        }
        return best
    },
    transform: ( support: SupportFunction, mat: Matrix ) => {
        let invMat = mat.inverse()
        return ( axis: Vector ) => mat.multiplyVec( support( invMat.multiplyVec( axis, 0 ) ) )
    },
    round: ( support: SupportFunction, radius ) => ( axis: Vector ) => support( axis ).add( axis.unit().scale( radius ) ),
    translate: ( support: SupportFunction, v: Vector ) => ( axis: Vector ) => support( axis ).add( v )
}
export default SupportFunctions