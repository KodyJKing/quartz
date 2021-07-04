import { Contact } from "../../collision/SAT"
import { clamp } from "../../math/math"
import { Vector } from "../../math/Vector"
import Body from "./Body"
import { Pair } from "./polygonPhysics"

export function solveVelocities(
    pairs: Pair[], options: { minBounceVelocity: number, restitution: number, coefficientOfFriction: number, solvePairs: boolean }
) {
    let { minBounceVelocity, restitution, coefficientOfFriction, solvePairs } = options
    for ( let pair of pairs ) {
        let { bodyA, bodyB, info } = pair
        let { normal } = info
        if ( solvePairs && info.contact.length == 2 )
            if ( solvePair( pair, restitution, coefficientOfFriction ) )
                continue
        for ( let contact of info.contact ) {
            let point = contact.point
            let ra = point.subtract( bodyA.position )
            let rb = point.subtract( bodyB.position )

            let raCrossN = ra.cross( normal )
            let rbCrossN = rb.cross( normal )

            let velA = bodyA.velocity.add( ra.crossZLeft( bodyA.angularVelocity ) )
            let velB = bodyB.velocity.add( rb.crossZLeft( bodyB.angularVelocity ) )
            let velBA = velB.subtract( velA )

            let _restitution = velBA.lengthSquared < minBounceVelocity ** 2 ? 0 : restitution
            let combinedEffectiveMass = 1 / ( 1 / bodyA.mass + 1 / bodyB.mass + raCrossN ** 2 / bodyA.inertia + rbCrossN ** 2 / bodyB.inertia )
            let normalImpulse = velBA.dot( normal ) * ( 1 + _restitution ) * combinedEffectiveMass

            applyImpulseAndFriction( bodyA, bodyB, contact, normal, normalImpulse, coefficientOfFriction )
        }
    }
}

function applyImpulse( body: Body, impulse: Vector, applicationPoint: Vector ) {
    let a = applicationPoint
    let ra = a.subtract( body.position )
    let angularImpulse = ra.cross( impulse )
    body.velocity.x += impulse.x / body.mass
    body.velocity.y += impulse.y / body.mass
    body.angularVelocity += angularImpulse / body.inertia
}

function applyImpulseAndFriction( bodyA: Body, bodyB: Body, contact: Contact, normal: Vector, normalImpulse: number, coefficientOfFriction: number ) {
    let oldImpulse = contact.impulse
    contact.impulse += normalImpulse
    contact.impulse = Math.min( 0, contact.impulse )
    normalImpulse = contact.impulse - oldImpulse

    let ra = contact.point.subtract( bodyA.position )
    let rb = contact.point.subtract( bodyB.position )

    let raCrossN = ra.cross( normal )
    let rbCrossN = rb.cross( normal )

    let velA = bodyA.velocity.add( ra.crossZLeft( bodyA.angularVelocity ) )
    let velB = bodyB.velocity.add( rb.crossZLeft( bodyB.angularVelocity ) )
    let velBA = velB.subtract( velA )

    let combinedEffectiveMass = 1 / ( 1 / bodyA.mass + 1 / bodyB.mass + raCrossN ** 2 / bodyA.inertia + rbCrossN ** 2 / bodyB.inertia )

    let coefficientOfStaticFriction = .5 // coefficientOfFriction * 5
    let maxStaticFriction = Math.abs( normalImpulse * coefficientOfStaticFriction )

    let tangent = normal.leftNormal()
    let tangentSpeed = velBA.dot( tangent )
    let tangentImpulse = tangentSpeed * combinedEffectiveMass // normalImpulse * coefficientOfFriction * Math.sign( tangentSpeed )
    if ( Math.abs( tangentSpeed ) > 100 && Math.abs( tangentImpulse ) > maxStaticFriction )
        tangentImpulse = normalImpulse * coefficientOfFriction * - Math.sign( tangentSpeed )

    let impulse = new Vector(
        normal.x * normalImpulse + tangent.x * tangentImpulse,
        normal.y * normalImpulse + tangent.y * tangentImpulse
    )

    if ( !bodyA.isStatic )
        applyImpulse( bodyA, impulse, contact.point )
    if ( !bodyB.isStatic )
        applyImpulse( bodyB, impulse.negate(), contact.point )
}

function deltaVelocityAt( body: Body, impulse: Vector, applicationPoint: Vector, testPoint: Vector ) {
    let a = applicationPoint
    let b = testPoint

    let ra = a.subtract( body.position )
    let angularImpulse = ra.cross( impulse )
    let deltaAngularVelocity = angularImpulse / body.inertia

    let rb = b.subtract( body.position )
    let deltaTangentialVelocity = rb.crossZLeft( deltaAngularVelocity )
    let deltaLinearVelocity = impulse.scale( 1 / body.mass )
    return deltaLinearVelocity.add( deltaTangentialVelocity )
}

function velocityAt( body: Body, p: Vector ) {
    let r = p.subtract( body.position )
    let tangentialVelocity = r.crossZLeft( body.angularVelocity )
    return body.velocity.add( tangentialVelocity )
}

function solvePair( pair: Pair, restitution: number, coefficientOfFriction: number ) {
    let { bodyA, bodyB, info } = pair
    let { normal, contact } = info
    let [ c1, c2 ] = contact
    let p1 = c1.point
    let p2 = c2.point

    let normalNeg = normal.negate()

    let dVel1 = velocityAt( bodyB, p1 ).subtract( velocityAt( bodyA, p1 ) ).dot( normal )
    let dVel2 = velocityAt( bodyB, p2 ).subtract( velocityAt( bodyA, p2 ) ).dot( normal )

    let impulse1OnP1 = deltaVelocityAt( bodyB, normal, p1, p1 ).subtract( deltaVelocityAt( bodyA, normalNeg, p1, p1 ) ).dot( normal )
    let impulse1OnP2 = deltaVelocityAt( bodyB, normal, p1, p2 ).subtract( deltaVelocityAt( bodyA, normalNeg, p1, p2 ) ).dot( normal )

    let impulse2OnP1 = deltaVelocityAt( bodyB, normal, p2, p1 ).subtract( deltaVelocityAt( bodyA, normalNeg, p2, p1 ) ).dot( normal )
    let impulse2OnP2 = deltaVelocityAt( bodyB, normal, p2, p2 ).subtract( deltaVelocityAt( bodyA, normalNeg, p2, p2 ) ).dot( normal )

    let M11 = impulse1OnP1, M12 = impulse2OnP1
    let M21 = impulse1OnP2, M22 = impulse2OnP2

    let det = M11 * M22 - M12 * M21, detInv = 1 / det

    if ( Math.abs( det ) < 1 )
        return false

    let I11 = M22 * detInv, I12 = - M12 * detInv
    let I21 = - M21 * detInv, I22 = M11 * detInv

    let impulse1 = ( I11 * dVel1 + I12 * dVel2 ) * ( 1 + restitution )
    let impulse2 = ( I21 * dVel1 + I22 * dVel2 ) * ( 1 + restitution )

    let diff = impulse1 - impulse2
    if ( Math.abs( diff ) < 10 ) {
        impulse1 = ( impulse1 + impulse2 ) * .5
        impulse2 = impulse1
    }

    applyImpulseAndFriction( bodyA, bodyB, c1, normal, impulse1, coefficientOfFriction )
    applyImpulseAndFriction( bodyA, bodyB, c2, normal, impulse2, coefficientOfFriction )

    return true
}