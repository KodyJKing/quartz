import Pair from "../collision/Pair"

export default function solvePositions(
    pairs: Pair[], options: { iterations: number, positionalDamping: number, allowedPenetration: number }
) {
    let { iterations, positionalDamping, allowedPenetration } = options
    for ( let i = 0; i < iterations; i++ ) {
        for ( let pair of pairs ) {
            let { bodyA, bodyB, info } = pair
            let { normal, separation } = info

            if ( separation > 0 )
                continue

            let massA = bodyA.mass
            let massB = bodyB.mass

            let correctedDisplacement = normal.dot( bodyB.positionalCorrection.subtract( bodyA.positionalCorrection ) )

            let displacement = ( -separation - correctedDisplacement - allowedPenetration ) * positionalDamping
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
}
