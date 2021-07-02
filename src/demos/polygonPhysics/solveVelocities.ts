import { Vector } from "../../math/Vector"
import { Pair } from "./polygonPhysics"

export function solveVelocities(
    pairs: Pair[], options: { minBounceVelocity: number, restitution: number, coefficientOfFriction: number }
) {
    let { minBounceVelocity, restitution, coefficientOfFriction } = options
    for ( let pair of pairs ) {
        let { bodyA, bodyB, info } = pair
        let { normal } = info
        for ( let c of info.contact ) {
            let ra = c.subtract( bodyA.position )
            let rb = c.subtract( bodyB.position )

            let raCrossN = ra.cross( normal )
            let rbCrossN = rb.cross( normal )

            let velA = bodyA.velocity.add( ra.crossZLeft( bodyA.angularVelocity ) )
            let velB = bodyB.velocity.add( rb.crossZLeft( bodyB.angularVelocity ) )
            let velBA = velB.subtract( velA )

            let _restitution = velBA.lengthSquared < minBounceVelocity ** 2 ? 0 : restitution
            let combinedEffectiveMass = 1 / ( 1 / bodyA.mass + 1 / bodyB.mass + raCrossN ** 2 / bodyA.inertia + rbCrossN ** 2 / bodyB.inertia )
            let normalImpulse = velBA.dot( normal ) * ( 1 + _restitution ) * combinedEffectiveMass

            if ( normalImpulse >= 0 )
                continue

            let tangent = normal.leftNormal()
            let tangentImpulse = normalImpulse * coefficientOfFriction * -Math.sign( velBA.dot( tangent ) )

            let impulse = new Vector(
                normal.x * normalImpulse + tangent.x * tangentImpulse,
                normal.y * normalImpulse + tangent.y * tangentImpulse
            )

            if ( !bodyA.isStatic ) {
                bodyA.velocity.x += impulse.x / bodyA.mass
                bodyA.velocity.y += impulse.y / bodyA.mass
                bodyA.angularVelocity += ra.cross( impulse ) / bodyA.inertia
            }
            if ( !bodyB.isStatic ) {
                bodyB.velocity.x -= impulse.x / bodyB.mass
                bodyB.velocity.y -= impulse.y / bodyB.mass
                bodyB.angularVelocity -= rb.cross( impulse ) / bodyB.inertia
            }
        }
    }
}
