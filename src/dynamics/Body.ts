import { notQuiteInfiniteMass } from "../common"
import Color, { Colors } from "../graphics/Color"
import AABB from "../math/AABB"
import Matrix from "../math/Matrix"
import Vector from "../math/Vector"

export default class Body {
    model: Vector[]
    vertices: Vector[]
    bounds: AABB
    position: Vector
    velocity: Vector
    angle: number
    angularVelocity: number
    mass: number
    invMass: number
    inertia: number
    invInertia: number
    isStatic: boolean
    color: string
    outlineColor: string
    id: number
    positionalCorrection: Vector
    static idCounter = 0
    constructor( args: {
        model: Vector[],
        position: Vector, velocity?: Vector,
        angle?: number, angularVelocity?: number
        mass?: number, inertia?: number,
        isStatic?: boolean,
        color?: string
    } ) {
        this.model = args.model
        this.position = args.position
        this.velocity = args.velocity ?? new Vector( 0, 0 )
        this.angle = args.angle ?? 0
        this.angularVelocity = args.angularVelocity ?? 0
        this.isStatic = args.isStatic ?? false
        this.mass = this.isStatic ? notQuiteInfiniteMass : ( args.mass ?? 1 )
        this.invMass = 1 / this.mass
        this.inertia = this.isStatic ? notQuiteInfiniteMass : ( args.inertia ?? 1 )
        this.invInertia = 1 / this.inertia
        this.vertices = this.transformedVertices()
        this.bounds = AABB.polygonBounds( this.vertices )
        this.color = args.color ?? "grey"
        this.outlineColor = Color.parse( this.color ).lerp( Colors.black, .05 ).toString()
        this.id = Body.idCounter++
        this.positionalCorrection = new Vector( 0, 0 )
    }

    getBounds() {
        return this.bounds
    }

    transformedVertices() {
        let { x, y } = this.position
        let mat = Matrix.transformation( 0, 0, this.angle, 1, 1, x, y )
        return this.model.map( v => mat.multiplyVec( v ) )
    }

    updateVertices() {
        let { x, y } = this.position
        let mat = Matrix.transformation( 0, 0, this.angle, 1, 1, x, y )
        for ( let i = 0; i < this.model.length; i++ )
            mat.multiplyVec( this.model[ i ], 1, this.vertices[ i ] )
        this.bounds = AABB.polygonBounds( this.vertices )
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

    updatePosition( timeStep ) {
        if ( this.isStatic )
            return

        this.position.x += this.velocity.x * timeStep
        this.position.y += this.velocity.y * timeStep
        this.angle += this.angularVelocity * timeStep
        this.updateVertices()
        this.healthCheck()
    }
}