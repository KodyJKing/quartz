import { Vector } from "../math/Vector"
import SupportFunction from "./SupportFunction"
import { modulus } from "../math/math"

export type CollisionInfo = { normal: Vector, separation: number, contact: Vector[] }
export default function SAT( polyA: Vector[], polyB: Vector[] ): CollisionInfo {
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

    let epsilon = 0.01
    let rotator = Vector.polar( epsilon, 1 )
    let normalHigh = maxNormal.complexProduct( rotator )
    let normalLow = maxNormal.complexQuotient( rotator )

    let aUpper = supportA( normalLow )
    let aLower = supportA( normalHigh )
    let bUpper = supportB(normalHigh.negate() )
    let bLower = supportB(normalLow.negate() )

    let tangent = maxNormal.rightNormal()
    let upperExtent = Math.min(aUpper.dot(tangent), bUpper.dot(tangent))
    let lowerExtent = Math.max(aLower.dot(tangent), bLower.dot(tangent))

    let aUpperContact = aUpper.clampAlongAxis(tangent, lowerExtent, upperExtent)
    let aLowerContact = aLower.clampAlongAxis(tangent, lowerExtent, upperExtent)
    let bUpperContact = bUpper.clampAlongAxis(tangent, lowerExtent, upperExtent)
    let bLowerContact = bLower.clampAlongAxis(tangent, lowerExtent, upperExtent)

    let upperContact = aUpperContact.lerp(bUpperContact, .5)
    let lowerContact = aLowerContact.lerp(bLowerContact, .5)

    let contacts = (upperExtent - lowerExtent) < 1 ? [upperContact] : [upperContact, lowerContact]
    // let contacts = [upperContact.lerp(lowerContact, .5)]

    return {
        normal: maxNormal,
        separation: maxDist,
        contact: contacts
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