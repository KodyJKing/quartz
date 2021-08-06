import { Pair } from "../collision/Collision"
import Vector from "../math/Vector"

export default function solveVelocities(
    pairs: Pair[], options: { iterations: number, minBounceVelocity: number, restitution: number, coefficientOfFriction: number }
) {
    let { iterations, minBounceVelocity, restitution, coefficientOfFriction } = options
    for ( let i = 0; i < iterations; i++ ) {
        for ( let j = 0; j < pairs.length; j++ ) {
            let pair = pairs[ j ]
            let { bodyA, bodyB, info } = pair
            let { normal, contact } = info
            for ( let k = 0; k < contact.length; k++ ) {
                let c = contact[ k ]

                let ra = c.subtract( bodyA.position )
                let rb = c.subtract( bodyB.position )

                let raCrossN = ra.cross( normal )
                let rbCrossN = rb.cross( normal )

                let velA = bodyA.velocity.add( ra.crossZLeft( bodyA.angularVelocity ) )
                let velB = bodyB.velocity.add( rb.crossZLeft( bodyB.angularVelocity ) )
                let velBA = velB.subtract( velA )

                let _restitution = velBA.lengthSquared() < minBounceVelocity ** 2 ? 0 : restitution
                let combinedEffectiveMass = 1 / ( bodyA.invMass + bodyB.invMass + raCrossN ** 2 * bodyA.invInertia + rbCrossN ** 2 * bodyB.invInertia )
                let normalImpulse = velBA.dot( normal ) * ( 1 + _restitution ) * combinedEffectiveMass

                if ( normalImpulse >= 0 )
                    continue

                // TODO: Rework friction. Follow this: https://gamedevelopment.tutsplus.com/tutorials/how-to-create-a-custom-2d-physics-engine-friction-scene-and-jump-table--gamedev-7756
                let tangent = normal.leftNormal()
                let tangentImpulse = normalImpulse * coefficientOfFriction * -Math.sign( velBA.dot( tangent ) )
                let impulse = new Vector(
                    normal.x * normalImpulse + tangent.x * tangentImpulse,
                    normal.y * normalImpulse + tangent.y * tangentImpulse
                )

                if ( !bodyA.isStatic ) {
                    bodyA.velocity.x += impulse.x * bodyA.invMass
                    bodyA.velocity.y += impulse.y * bodyA.invMass
                    bodyA.angularVelocity += ra.cross( impulse ) * bodyA.invInertia
                }
                if ( !bodyB.isStatic ) {
                    bodyB.velocity.x -= impulse.x * bodyB.invMass
                    bodyB.velocity.y -= impulse.y * bodyB.invMass
                    bodyB.angularVelocity -= rb.cross( impulse ) * bodyB.invInertia
                }
            }
        }
    }
}
