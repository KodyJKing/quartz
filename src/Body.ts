import { Vector } from "./math/Vector"

export default class Body {
    pos: Vector
    vel: Vector
    radius: number
    mass: number
    color: string
    id: number
    isStatic: boolean = false
    static idCounter = 0
    constructor( args: { pos: Vector, radius: number, mass?: number, vel?: Vector, color?: string, isStatic?: boolean } ) {
        this.pos = args.pos
        this.radius = args.radius
        this.vel = args.vel ?? new Vector( 0, 0 )
        this.isStatic = args.isStatic ?? false
        this.mass = this.isStatic ? 1e+32 : ( args.mass ?? this.radius ** 2 )
        this.color = args.color ?? "red"
        this.id = Body.idCounter++
        // this.color = "#" + ( ( Math.random() * 16 ** 6 ) | 0 ).toString( 16 ).padStart( 6, "0" )
    }
}