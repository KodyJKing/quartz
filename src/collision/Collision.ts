import Body from "../dynamics/Body"
import { modulus } from "../math/math"
import SupportFunctions, { SupportFunction } from "../math/SupportFunctions"
import Vector from "../math/Vector"
import Broadphase from "./Broadphase"
import CircleCollider from "./CircleCollider"
import ICollider from "./ICollider"
import PolygonCollider from "./PolygonCollider"

// Normal should always face away from bodyA
export type CollisionInfo = { normal: Vector, separation: number, contact: Vector[] }
export type Pair = { bodyA: Body, bodyB: Body, info: CollisionInfo }
export type RaycastInfo = { time: number, normal: Vector }

export function getCollisionPairs( bodies: Body[], gridWidth: number, gridHeight: number, gridCellSize: number ) {
    let pairs: Pair[] = []
    Broadphase.findPairs(
        bodies, gridWidth, gridHeight, gridCellSize,
        ( bodyA, bodyB ) => {
            let info = getCollisionInfo( bodyA.collider, bodyB.collider )
            if ( !info )
                return
            if ( info.separation <= 0 )
                pairs.push( { bodyA, bodyB, info } )
        }
    )
    return pairs
}

export function getCollisionInfo( a: ICollider, b: ICollider ) {
    if ( a instanceof PolygonCollider && b instanceof PolygonCollider )
        return polygonVsPolygon( a.vertices, b.vertices )
    if ( a instanceof CircleCollider && b instanceof CircleCollider )
        return circleVsCirlce( a, b )
    if ( a instanceof PolygonCollider && b instanceof CircleCollider )
        return polygonVsCircle( a, b, 1 )
    if ( a instanceof CircleCollider && b instanceof PolygonCollider )
        return polygonVsCircle( b, a, -1 )
    return undefined
}

function circleVsCirlce( a: CircleCollider, b: CircleCollider ): CollisionInfo {
    let aPos = a.body.position, bPos = b.body.position
    let diff = bPos.subtract( aPos )
    let separation = diff.length() - a.radius - b.radius
    let normal = diff.unit()
    let contact = [ aPos.add( normal.scale( a.radius + separation / 2 ) ) ]
    return { normal, separation, contact }
}

export function polygonVsPolygon( polyA: Vector[], polyB: Vector[] ): CollisionInfo {
    let supportA = SupportFunctions.polygon( polyA ), supportB = SupportFunctions.polygon( polyB )
    let normal = Vector.zero
    let separation = -Infinity
    function checkPolygonAxes( poly: Vector[], otherSupport: SupportFunction, normalSign: number ) {
        for ( let i = 0; i < poly.length; i++ ) {
            let j = modulus( i + 1, poly.length )
            let pt_i = poly[ i ], pt_j = poly[ j ]
            let edgeNormal = pt_j.subtract( pt_i ).leftNormal().unit() // Normal toward "poly"
            let distance = pt_i.dot( edgeNormal ) - otherSupport( edgeNormal ).dot( edgeNormal )
            if ( distance > separation )
                separation = distance, normal = edgeNormal.scale( normalSign )
        }
        return { separation, normal }
    }
    checkPolygonAxes( polyA, supportB, -1 )
    checkPolygonAxes( polyB, supportA, 1 )
    let contacts = generateContacts( supportA, supportB, normal )
    return {
        normal,
        separation,
        contact: contacts
    }
}

function polygonVsCircle( poly: PolygonCollider, circle: CircleCollider, normalSign: number ): CollisionInfo {
    let circlePos = circle.body.position
    let vertices = poly.vertices
    let separation = -Infinity
    let normal = Vector.zero
    for ( let i = 0; i < vertices.length; i++ ) {
        let j = modulus( i + 1, vertices.length )
        let pt_i = vertices[ i ], pt_j = vertices[ j ]
        let edgeNormal = pt_j.subtract( pt_i ).rightNormal().unit() // Normal away from "poly"
        let distance = circle.support( edgeNormal.negate() ).dot( edgeNormal ) - pt_i.dot( edgeNormal )
        if ( distance > separation )
            separation = distance, normal = edgeNormal.scale( normalSign )
        let vertexNormal = circlePos.subtract( pt_i ).unit() // Normal away from "poly"
        distance = circle.support( vertexNormal.negate() ).dot( vertexNormal ) - poly.support( vertexNormal ).dot( vertexNormal )
        if ( distance > separation )
            separation = distance, normal = vertexNormal.scale( normalSign )
    }
    let normalAwayFromCircle = normal.scale( -normalSign )
    let contacts = [ circlePos.add( normalAwayFromCircle.scale( circle.radius + separation / 2 ) ) ]
    return {
        normal,
        separation,
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
            return { time, normal }
        }

        if ( c.dot( ray.rightNormal() ) > 0 )
            a = c
        else
            b = c
    }
}