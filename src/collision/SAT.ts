import Vector from "../math/Vector"
import SupportFunction, { polygonSupport } from "./SupportFunction"
import { modulus } from "../math/math"
import Edge from "../math/Edge"
import Geometry from "../math/Geometry"

export type CollisionInfo = { normal: Vector, separation: number, contact: Vector[] }
export default SAT
function _SAT( polyA: Vector[], polyB: Vector[] ): CollisionInfo {
    let maxNormal = Vector.zero
    let maxDist = -Infinity
    function maxSeperationAxis( poly: Vector[], otherSupport: SupportFunction, sign: number ) {
        for ( let i = 0; i < poly.length; i++ ) {
            let j = modulus( i + 1, poly.length )
            let pt_i = poly[ i ], pt_j = poly[ j ]
            let normal = pt_j.subtract( pt_i ).leftNormal().unit() // Inward normal
            let dist = pt_i.dot( normal ) - otherSupport( normal ).dot( normal )
            if ( dist > maxDist )
                maxDist = dist, maxNormal = normal.scale( sign )
        }
    }

    let supportA = polygonSupport( polyA ), supportB = polygonSupport( polyB )
    maxSeperationAxis( polyA, supportB, -1 )
    maxSeperationAxis( polyB, supportA, 1 )

    let contacts = generateContacts( supportA, supportB, maxNormal )

    return {
        normal: maxNormal,
        separation: maxDist,
        contact: contacts
    }
}

function SAT( polyA: Vector[], polyB: Vector[] ): CollisionInfo {
    let referencePoly = polyA
    let incidentPoly = polyB
    let referenceEdgeIndex = 0
    let incidentPointIndex = 0
    let referenceNormal = Vector.zero
    let maxDist = -Infinity

    function checkAxes( poly: Vector[], other: Vector[], sign: number ) {
        for ( let i = 0; i < poly.length; i++ ) {
            let j = modulus( i + 1, poly.length )
            let pt_i = poly[ i ], pt_j = poly[ j ]
            let normal = pt_j.subtract( pt_i ).leftNormal().unit() // Inward normal
            let supportIndex = polygonSupportIndex( other, normal )
            let support = other[ supportIndex ]
            let dist = pt_i.dot( normal ) - support.dot( normal )
            if ( dist > maxDist ) {
                maxDist = dist
                referenceNormal = normal.scale( 1 )
                referencePoly = poly
                incidentPoly = other
                referenceEdgeIndex = i
                incidentPointIndex = supportIndex
            }
        }
    }

    checkAxes( polyA, polyB, -1 )
    checkAxes( polyB, polyA, 1 )

    let supportA = polygonSupport( polyA ), supportB = polygonSupport( polyB )
    let normal = ( referencePoly == polyA ) ? referenceNormal.scale( -1 ) : referenceNormal

    let rPoly = referencePoly
    let ri = referenceEdgeIndex
    let referenceEdge = new Edge( rPoly[ ri ], rPoly[ modulus( ri + 1, rPoly.length ) ] )
    let incidentEdge = getEdge( incidentPoly, referenceNormal, incidentPointIndex )

    let contacts = generateContacts( supportA, supportB, normal )
    // let contacts = generateContacts2( referenceEdge, incidentEdge, referenceNormal )
    return {
        normal,
        separation: maxDist,
        contact: contacts
    }
}


function polygonSupportIndex( poly: Vector[], axis: Vector ) {
    let best = 0
    let bestDist = poly[ 0 ].dot( axis )
    for ( let i = 1; i < poly.length; i++ ) {
        let next = poly[ i ]
        let nextDist = next.dot( axis )
        if ( nextDist > bestDist )
            best = i, bestDist = nextDist
    }
    return best
}

function getEdge( poly: Vector[], normal: Vector, vertexIndex: number ) {
    let vPrev = poly[ modulus( vertexIndex - 1, poly.length ) ]
    let v = poly[ vertexIndex ]
    let vNext = poly[ ( vertexIndex + 1 ) % poly.length ]
    if ( vPrev.dot( normal ) > vNext.dot( normal ) )
        return new Edge( vPrev, v )
    else
        return new Edge( v, vNext )
}

function generateContacts( supportA: SupportFunction, supportB: SupportFunction, normal: Vector, angularTolerance = 0.01 ) {
    // TODO: Simplify and reduce the number of allocations here.

    let rotator = Vector.polar( angularTolerance, 1 )
    let normalHigh = normal.complexProduct( rotator )
    let normalLow = normal.complexQuotient( rotator )

    let aUpper = supportA( normalLow )
    let aLower = supportA( normalHigh )
    let bUpper = supportB( normalHigh.negate() )
    let bLower = supportB( normalLow.negate() )

    let tangent = normal.rightNormal()
    let upperExtent = Math.min( aUpper.dot( tangent ), bUpper.dot( tangent ) )
    let lowerExtent = Math.max( aLower.dot( tangent ), bLower.dot( tangent ) )

    let aUpperContact = aUpper.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let aLowerContact = aLower.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let bUpperContact = bUpper.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let bLowerContact = bLower.clampAlongAxis( tangent, lowerExtent, upperExtent )

    let upperContact = aUpperContact.lerp( bUpperContact, .5 )
    let lowerContact = aLowerContact.lerp( bLowerContact, .5 )

    if ( upperExtent - lowerExtent < 1 )
        return [ upperContact ]

    // return [ upperContact, lowerContact ]

    if ( Math.random() < .5 )
        return [ upperContact, lowerContact ]
    else
        return [ lowerContact, upperContact ]
}

export function generateContacts2( referenceEdge: Edge, incidentEdge: Edge, referenceNormal: Vector ) {
    let iEdge = incidentEdge
    let rEdge = referenceEdge
    iEdge.clipTo( rEdge )

    let refDist = referenceEdge.a.dot( referenceNormal )
    if ( iEdge.a.dot( referenceNormal ) < refDist )
        iEdge.a = iEdge.intersect( rEdge ) ?? iEdge.a
    else if ( iEdge.b.dot( referenceNormal ) < refDist )
        iEdge.b = iEdge.intersect( rEdge ) ?? iEdge.b

    let { a, b } = iEdge

    if ( a.distanceSq( b ) < 1 )
        return [ a ]

    // let tolerance = 0.1
    // if ( a.dot( referenceNormal ) < refDist )
    //     return [ b ]
    // else if ( b.dot( referenceNormal ) < refDist )
    //     return [ a ]

    return [ a, b ]
}