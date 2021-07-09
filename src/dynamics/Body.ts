import ICollider from "../collision/ICollider"
import { notQuiteInfiniteMass } from "../common"
import Color, { Colors } from "../graphics/Color"
import AABB from "../math/AABB"
import { threshold } from "../math/math"
import Matrix from "../math/Matrix"
import Vector from "../math/Vector"

export default class Body {
    collider: ICollider
    position: Vector
    velocity: Vector
    angle: number
    angularVelocity: number
    mass: number; invMass: number
    inertia: number; invInertia: number
    isStatic: boolean
    color: string; outlineColor: string
    id: number
    positionalCorrection: Vector
    static idCounter = 0
    constructor( args: {
        collider: ICollider,
        position: Vector, velocity?: Vector,
        angle?: number, angularVelocity?: number
        mass?: number, inertia?: number,
        isStatic?: boolean,
        color?: string
    } ) {
        this.position = args.position
        this.velocity = args.velocity ?? new Vector( 0, 0 )
        this.angle = args.angle ?? 0
        this.angularVelocity = args.angularVelocity ?? 0
        this.collider = args.collider; this.collider.body = this; this.collider.onUpdatePosition()
        this.isStatic = args.isStatic ?? false
        this.mass = this.isStatic ? notQuiteInfiniteMass : ( args.mass ?? 1 )
        this.invMass = 1 / this.mass
        this.inertia = this.isStatic ? notQuiteInfiniteMass : ( args.inertia ?? 1 )
        this.invInertia = 1 / this.inertia
        this.color = args.color ?? "grey"
        this.outlineColor = Color.parse( this.color ).lerp( Colors.black, .05 ).toString()
        this.id = Body.idCounter++
        this.positionalCorrection = new Vector( 0, 0 )
    }

    getBounds() {
        return this.collider.bounds
    }

    healthCheck() {
        let { x, y } = this.position
        if ( isNaN( x ) || isNaN( y ) )
            throw new Error( "NaN component!" )
    }

    updateVelocity( timeStep, gravity, rotationalAirDrag, linearAirDrag ) {
        if ( this.isStatic )
            return

        this.angularVelocity *= rotationalAirDrag
        this.velocity.x *= linearAirDrag
        this.velocity.y *= linearAirDrag

        this.velocity.y += gravity * timeStep

        this.positionalCorrection.x = 0
        this.positionalCorrection.y = 0
    }

    updatePosition( timeStep, linearMotionThreshold = .1, angularMotionThreshold = .001 ) {
        if ( this.isStatic )
            return

        let dx = this.velocity.x * timeStep
        let dy = this.velocity.y * timeStep
        let dTheta = this.angularVelocity * timeStep

        // this.position.x += dx
        // this.position.y += dy
        // this.angle += dTheta

        this.position.x += threshold( dx, linearMotionThreshold )
        this.position.y += threshold( dy, linearMotionThreshold )
        this.angle += threshold( dTheta, angularMotionThreshold )

        // this.angle %= Math.PI
        // this.angle = threshold( this.angle, .001 )

        this.collider.onUpdatePosition()
        this.healthCheck()
    }
}