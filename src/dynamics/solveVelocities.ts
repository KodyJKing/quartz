import { Pair } from "../collision/Collision"
import Vector from "../math/Vector"

export default function solveVelocities(
    pairs: Pair[], options: { 
        iterations: number, minBounceVelocity: number, restitution: number,
        friction: number, staticFriction: number
    }
) {
    let { iterations, minBounceVelocity, restitution, friction, staticFriction } = options
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

                let tangent = normal.leftNormal()
                // let tangentImpulse = normalImpulse * friction * -Math.sign( velBA.dot( tangent ) )
                let raCrossI = ra.cross( tangent )
                let rbCrossI = rb.cross( tangent )
                let combinedEffectiveMassI = 1 / ( bodyA.invMass + bodyB.invMass + raCrossI ** 2 * bodyA.invInertia + rbCrossI ** 2 * bodyB.invInertia )
                // let tangentImpulse = -velBA.dot( tangent ) * (1 + _restitution) * combinedEffectiveMassI
                let tangentImpulse = -velBA.dot( tangent ) * combinedEffectiveMassI
                if (Math.abs(tangentImpulse) > Math.abs(normalImpulse * staticFriction)) {
                    tangentImpulse = normalImpulse * friction * -Math.sign( velBA.dot( tangent ) )
                }

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
