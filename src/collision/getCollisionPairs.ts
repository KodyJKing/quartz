import Body from "../dynamics/Body"
import Broadphase from "./Broadphase"
import Pair from "./Pair"
import SAT from "./SAT"

export default function getCollisionPairs( bodies: Body[], gridWidth: number, gridHeight: number, gridCellSize: number ) {
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
