import { Vector } from "../math/Vector"
import SupportFunction from "./SupportFunction"
import { modulus } from "../math/math"

export default function SAT( polyA: Vector[], polyB: Vector[] ) {
    let maxNormal = Vector.zero
    let maxDist = -Infinity
    function maxSeperationAxisSingle( poly: Vector[], otherSupport: SupportFunction, sign: number ) {
        for ( let i = 0; i < poly.length; i++ ) {
            let j = ( i + 1 ) % poly.length
            let pt_i = poly[ i ], pt_j = poly[ j ]
            let normal = pt_j.subtract( pt_i ).leftNormal() // Inward normal
            let dist = otherSupport( normal ).dot( normal ) - pt_i.dot( normal )
            if ( dist > maxDist )
                maxDist = dist, maxNormal = normal.scale( sign )
        }
    }
    maxSeperationAxisSingle( polyA, polySupport( polyB ), 1 )
    maxSeperationAxisSingle( polyB, polySupport( polyA ), -1 )
    return { normal: maxNormal, separation: maxDist }
}

export function polySupport( poly: Vector[] ): SupportFunction {
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