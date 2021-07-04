import SAT from "../../collision/SAT"
import { Pair } from "./polygonPhysics"

export function solvePositions(
    pairs: Pair[], options: { positionalDamping: number }
) {
    // TODO: Try implementing per contact solving, with angular displacements. Also try solving both contacts simultaneously.
    let { positionalDamping } = options
    for ( let pair of pairs ) {
        let { bodyA, bodyB, info } = pair
        let { normal, separation } = info

        if ( separation > 0 )
            continue

        let massA = bodyA.mass
        let massB = bodyB.mass

        let correctedDisplacement = normal.dot( bodyB.positionalCorrection.subtract( bodyA.positionalCorrection ) )

        let displacement = ( -separation - correctedDisplacement ) * positionalDamping
        let massRatio = massB / massA
        let displacementB = displacement / ( 1 + massRatio )
        let displacementA = displacement - displacementB

        if ( !bodyA.isStatic ) {
            bodyA.position.x -= normal.x * displacementA
            bodyA.position.y -= normal.y * displacementA
            bodyA.positionalCorrection.x -= normal.x * displacementA
            bodyA.positionalCorrection.y -= normal.y * displacementA
        }

        if ( !bodyB.isStatic ) {
            bodyB.position.x += normal.x * displacementB
            bodyB.position.y += normal.y * displacementB
            bodyB.positionalCorrection.x += normal.x * displacementB
            bodyB.positionalCorrection.y += normal.y * displacementB
        }

    }
}
