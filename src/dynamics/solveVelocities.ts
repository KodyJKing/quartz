import Pair from "../collision/Pair"
import Vector from "../math/Vector"

const
    ra = new Vector( 0, 0 ),
    rb = new Vector( 0, 0 ),
    velA = new Vector( 0, 0 ),
    velB = new Vector( 0, 0 ),
    velBA = new Vector( 0, 0 ),
    tangent = new Vector( 0, 0 ),
    impulse = new Vector( 0, 0 ),
    tmp = new Vector( 0, 0 )

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

                c.hot_subtract( bodyA.position, ra )
                c.hot_subtract( bodyB.position, rb )

                let raCrossN = ra.cross( normal )
                let rbCrossN = rb.cross( normal )

                bodyA.velocity.hot_add( ra.hot_crossZLeft( bodyA.angularVelocity, tmp ), velA )
                bodyB.velocity.hot_add( rb.hot_crossZLeft( bodyB.angularVelocity, tmp ), velB )
                velB.hot_subtract( velA, velBA )

                let _restitution = velBA.getLengthSquared() < minBounceVelocity ** 2 ? 0 : restitution
                let combinedEffectiveMass = 1 / ( bodyA.invMass + bodyB.invMass + raCrossN ** 2 * bodyA.invInertia + rbCrossN ** 2 * bodyB.invInertia )
                let normalImpulse = velBA.dot( normal ) * ( 1 + _restitution ) * combinedEffectiveMass

                if ( normalImpulse >= 0 )
                    continue

                normal.hot_leftNormal( tangent )
                let tangentImpulse = normalImpulse * coefficientOfFriction * -Math.sign( velBA.dot( tangent ) )

                impulse.set(
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
