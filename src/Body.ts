import { Vector } from "./Vector"

export default class Body {
    pos: Vector
    vel: Vector
    radius: number
    mass: number
    color: string
    id: number
    static idCounter = 0
    constructor( pos: Vector, radius: number, vel = new Vector( 0, 0 ), color = "red" ) {
        this.pos = pos
        this.radius = radius
        this.vel = vel
        this.mass = 1
        this.color = color
        this.id = Body.idCounter++
        // this.color = "#" + ( ( Math.random() * 16 ** 6 ) | 0 ).toString( 16 ).padStart( 6, "0" )
    }
    healthCheck() {
        if (
            isNaN( this.vel.x ) || isNaN( this.vel.y ) ||
            isNaN( this.pos.x ) || isNaN( this.pos.y )
        )
            debugger
    }
}