import Body from "../dynamics/Body"
import { modulus } from "../math/math"
import SupportFunctions, { SupportFunction } from "../math/SupportFunctions"
import Vector from "../math/Vector"
import Broadphase from "./Broadphase"

export type CollisionInfo = { normal: Vector, separation: number, contact: Vector[] }
export type Pair = { bodyA: Body, bodyB: Body, info: CollisionInfo }
export type RaycastInfo = { time: number, normal: Vector }

export function getCollisionPairs( bodies: Body[], gridWidth: number, gridHeight: number, gridCellSize: number ) {
    let pairs: Pair[] = []
    Broadphase.findPairs(
        bodies, gridWidth, gridHeight, gridCellSize,
        ( bodyA, bodyB ) => {
            let info = SAT( bodyA.vertices, bodyB.vertices )
            if ( info.separation <= 0 )
                pairs.push( { bodyA, bodyB, info } )
        }
    )
    return pairs
}

export function SAT( polyA: Vector[], polyB: Vector[] ): CollisionInfo {
    let maxNormal = Vector.zero
    let maxDist = -Infinity
    function maxSeperationAxis( poly: Vector[], otherSupport: SupportFunction, sign: number ) {
        for ( let i = 0; i < poly.length; i++ ) {
            i = modulus( i, poly.length )
            let j = modulus( i + 1, poly.length )
            let pt_i = poly[ i ], pt_j = poly[ j ]
            let normal = pt_j.subtract( pt_i ).leftNormal().unit() // Inward normal
            let dist = pt_i.dot( normal ) - otherSupport( normal ).dot( normal )
            if ( dist > maxDist )
                maxDist = dist, maxNormal = normal.scale( sign )
        }
    }

    let supportA = SupportFunctions.polygon( polyA ), supportB = SupportFunctions.polygon( polyB )
    maxSeperationAxis( polyA, supportB, -1 )
    maxSeperationAxis( polyB, supportA, 1 )

    let contacts = generateContacts( supportA, supportB, maxNormal )

    return {
        normal: maxNormal,
        separation: maxDist,
        contact: contacts
    }
}

export function generateContacts( supportA: SupportFunction, supportB: SupportFunction, normal: Vector, angularTolerance = 0.01 ) {
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

    return [ upperContact.lerp( lowerContact, .5 ), upperContact, lowerContact ]
    // return [ upperContact, lowerContact ]
}

export function shapecast( supportA: SupportFunction, velocityA: Vector, supportB: SupportFunction, velocityB: Vector ) {
    let minkowskiDiff = ( axis: Vector ) => supportA( axis ).subtract( supportB( axis.negate() ) )
    let relativeVelocity = velocityB.subtract( velocityA )
    return raycastSupportFunction( minkowskiDiff, relativeVelocity )
}

function raycastSupportFunction( support: SupportFunction, ray: Vector, maxIterations = 10 ): RaycastInfo | undefined {
    let a = support( ray.rightNormal() )
    let b = support( ray.leftNormal() )

    if ( a.dot( ray.rightNormal() ) < 0 )
        return undefined

    if ( b.dot( ray.leftNormal() ) < 0 )
        return undefined

    let i = 0
    while ( true ) {
        let ab = b.subtract( a )
        let ao = a.negate()
        let abNormal = ab.normalOnSide( ao )
        let c = support( abNormal )

        if ( ( ++i == maxIterations ) || c.equivalent( a ) || c.equivalent( b ) ) {
            let normal = abNormal.unit()
            let edgeDist = normal.dot( a )
            let approachSpeed = normal.dot( ray )
            let time = edgeDist / approachSpeed
            // let hitPoint = Geometry.intersect( ray.rightNormal(), 0, abNormal, a.dot( abNormal ) )
            // if ( !hitPoint ) return null // This should never happen.
            // let time = hitPoint.dot( ray )
            return { time, normal }
        }

        if ( c.dot( ray.rightNormal() ) > 0 )
            a = c
        else
            b = c
    }
}