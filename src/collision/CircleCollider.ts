import Body from "../dynamics/Body"
import AABB from "../math/AABB"
import Vector from "../math/Vector"
import ICollider from "./ICollider"

export default class CircleCollider implements ICollider {
    body!: Body
    bounds!: AABB
    radius: number
    constructor( radius: number ) {
        this.radius = radius
    }
    support( axis: Vector ): Vector {
        return this.body.position.add( axis.unit().scale( this.radius ) )
    }
    onUpdatePosition(): void {
        let r = this.radius
        let { x, y } = this.body.position
        this.bounds = new AABB( x - r, y - r, x + r, y + r )
    }
}