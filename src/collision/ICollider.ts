import Body from "../dynamics/Body"
import AABB from "../math/AABB"
import Vector from "../math/Vector"

export default interface ICollider {
    body: Body
    bounds: AABB
    support( axis: Vector ): Vector
    onUpdatePosition(): void
}