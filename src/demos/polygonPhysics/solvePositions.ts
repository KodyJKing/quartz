import SAT from "../../collision/SAT"
import Body from "./Body"
import { Pair } from "./polygonPhysics"

export function solvePositions(
    pairs: Pair[], options: { positionalDamping: number }
) {
    // TODO: Try implementing per contact solving, with angular displacements. Also try solving both contacts simultaneously.
    let { positionalDamping } = options
    for ( let pair of pairs ) {
        let { bodyA, bodyB, info } = pair
        let { normal, separation } = info

        let massA = bodyA.mass
        let massB = bodyB.mass

        let correctedDisplacement = normal.dot( bodyB.positionalCorrection.subtract( bodyA.positionalCorrection ) )

        let displacement = ( -separation - correctedDisplacement ) * positionalDamping
        let massRatio = massB / massA
        let displacementB = displacement / ( 1 + massRatio )
        let displacementA = displacement - displacementB

        if ( !bodyA.isStatic ) {
            bodyA.positionalCorrection.x -= normal.x * displacementA
            bodyA.positionalCorrection.y -= normal.y * displacementA
        }

        if ( !bodyB.isStatic ) {
            bodyB.positionalCorrection.x += normal.x * displacementB
            bodyB.positionalCorrection.y += normal.y * displacementB
        }
    }
}

export function applyPositionalCorrections( bodies: Body[], positionalWarming: number ) {
    for ( let body of bodies ) {
        if ( !body.isStatic ) {
            body.position.x += body.positionalCorrection.x
            body.position.y += body.positionalCorrection.y
            body.positionalCorrection.x *= positionalWarming
            body.positionalCorrection.y *= positionalWarming
        }
    }
}