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
            let normal = pt_j.subtract( pt_i ).leftNormal().unit() // Inward normal
            let dist = pt_i.dot( normal ) - otherSupport( normal ).dot( normal )
            if ( dist > maxDist )
                maxDist = dist, maxNormal = normal.scale( sign )
        }
    }

    let supportA = polySupport( polyA ), supportB = polySupport( polyB )
    maxSeperationAxisSingle( polyA, supportB, -1 )
    maxSeperationAxisSingle( polyB, supportA, 1 )

    let epsilon = 0.1
    let rotator = Vector.polar( epsilon, 1 )
    let normalHigh = maxNormal.complexProduct( rotator )
    let normalLow = maxNormal.complexQuotient( rotator )

    return {
        normal: maxNormal,
        separation: maxDist,
        contact: {
            a: {
                high: supportA( normalHigh ),
                low: supportA( normalLow ),
            },
            b: {
                high: supportB( normalHigh.negate() ),
                low: supportB( normalLow.negate() ),
            }
        }
    }
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