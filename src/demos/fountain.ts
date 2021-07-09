/* 
    This demo is redundant because the engine now supports circle and polygon colliders together.
    It's still nice to keep this for comparison. Ideally further abstractions shouldn't
    hurt the pure circle on circle performance and stability.
*/
import Clock from "../Clock"
import Broadphase from "../collision/Broadphase"
import { initCanvas, notQuiteInfiniteMass } from "../common"
import Input from "../Input"
import AABB from "../math/AABB"
import { clamp } from "../math/math"
import Vector from "../math/Vector"

class Body {
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
    getBounds() {
        return new AABB(
            this.pos.x - this.radius, this.pos.y - this.radius,
            this.pos.x + this.radius, this.pos.y + this.radius
        )
    }
}

let canvas = initCanvas()
let c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
let input = new Input()
let clock = new Clock()
let bodies: Body[] = []
const positionalDamping = 0.25
const positionalIterations = 7
const velocityIterations = 7
const restitution = 0.8
const gravity = 1000
const timeStep = 1 / 120
const updatesPerFrame = 1
const offscreenMargin = 60
const gridCellSize = 20

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]
const staticCircleColor = "#d1ccb6"

for ( let i = 0; i < 1500; i++ ) {
    let pos = new Vector(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    )
    let vel = new Vector(
        ( Math.random() - .5 ) * 1000,
        ( Math.random() - .5 ) * 1000
    )
    // let radius = 12.5
    let radius = ( Math.random() * 10 + 20 ) * .5
    let color = colorPalette[ Math.random() * colorPalette.length | 0 ]
    let body = new Body( { pos, radius, vel, color } )
    bodies.push( body )
}
bodies.push( new Body( {
    pos: new Vector( canvas.width / 2, canvas.height / 4 ),
    radius: 100,
    color: staticCircleColor,
    isStatic: true
} ) )
bodies.push( new Body( {
    pos: new Vector( canvas.width / 2 + 200, canvas.height / 2 ),
    radius: 100,
    color: staticCircleColor,
    isStatic: true
} ) )
bodies.push( new Body( {
    pos: new Vector( canvas.width / 2 - 200, canvas.height / 2 ),
    radius: 100,
    color: staticCircleColor,
    isStatic: true
} ) )
bodies.push( new Body( {
    pos: new Vector( canvas.width, canvas.height ),
    radius: 100,
    color: staticCircleColor,
    isStatic: true
} ) )
bodies.push( new Body( {
    pos: new Vector( 0, canvas.height ),
    radius: 100,
    color: staticCircleColor,
    isStatic: true
} ) )

mainLoop()
function mainLoop() {
    clock.nextFrame()
    render()
    for ( let i = 0; i < updatesPerFrame; i++ )
        update()
    window.setTimeout( mainLoop, timeStep * updatesPerFrame )
}

function render() {
    c.fillStyle = "#ebe6d1"
    c.fillRect( 0, 0, canvas.width, canvas.height )

    for ( let body of bodies ) {
        let { x, y } = body.pos
        c.beginPath()
        c.arc( x, y, body.radius, 0, Math.PI * 2 )
        c.fillStyle = body.color
        c.fill()
    }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function update() {
    for ( let body of bodies ) {
        if ( !body.isStatic && body.pos.x > canvas.width + offscreenMargin || body.pos.x < -offscreenMargin ) {
            body.vel.x = ( Math.random() - .5 ) * 100
            body.vel.y = ( Math.random() - .25 ) * 100
            body.pos.x = canvas.width / 2 + ( Math.random() - .5 ) * 500
            body.pos.y = -20 //canvas.height / 8 + ( Math.random() - .5 ) * 500
        }
        if ( !body.isStatic ) {
            let { pos, vel } = body
            if ( !input.mouse.get( 2 ) )
                vel.y += timeStep * gravity
            if ( input.mouse.get( 0 ) ) {
                let diff = input.cursor.subtract( pos )
                let length = Math.max( diff.length(), 50 )
                diff = diff.scale( -50000000 / length ** 3 )
                vel.x += timeStep * diff.x
                vel.y += timeStep * diff.y
            }
            pos.x += vel.x * timeStep
            pos.y += vel.y * timeStep
        }
    }

    let pairs = generateCollisions()
    for ( let i = 0; i < velocityIterations; i++ )
        solveVelocities( pairs )
    for ( let i = 0; i < positionalIterations; i++ )
        solvePositions( pairs )
}

function solvePositions( pairs: Collision[] ) {
    for ( let pair of pairs ) {
        let { bodyA, bodyB, normal, penetration } = pair

        let _penetration = penetration()
        if ( _penetration < 0 ) continue

        let massA = bodyA?.mass ?? notQuiteInfiniteMass
        let massB = bodyB?.mass ?? notQuiteInfiniteMass

        let displacement = _penetration * positionalDamping
        let massRatio = massB / massA
        let displacementB = displacement / ( 1 + massRatio )
        let displacementA = displacement - displacementB

        if ( bodyA && !bodyA.isStatic ) {
            bodyA.pos.x -= normal.x * displacementA
            bodyA.pos.y -= normal.y * displacementA
        }

        if ( bodyB && !bodyB.isStatic ) {
            bodyB.pos.x += normal.x * displacementB
            bodyB.pos.y += normal.y * displacementB
        }
    }
}

function solveVelocities( pairs: Collision[] ) {
    for ( let pair of pairs ) {
        let { bodyA, bodyB, normal, penetration } = pair

        let _penetration = penetration()
        if ( _penetration < 0 ) continue

        let massA = bodyA?.mass ?? notQuiteInfiniteMass
        let massB = bodyB?.mass ?? notQuiteInfiniteMass
        let velA = bodyA.vel ?? new Vector( 0, 0 )
        let velB = bodyB?.vel ?? new Vector( 0, 0 )

        // See impulse formula here https://www.randygaul.net/2013/03/27/game-physics-engine-part-1-impulse-resolution/
        let combinedEffectiveMass = 1 / ( 1 / massA + 1 / massB )
        let velBA = velB.subtract( velA )
        let impulse = velBA.dot( normal ) * ( 1 + restitution ) * combinedEffectiveMass

        if ( impulse > 0 ) continue

        if ( bodyA && !bodyA.isStatic ) {
            bodyA.vel.x += normal.x * impulse / massA
            bodyA.vel.y += normal.y * impulse / massA
        }

        if ( bodyB && !bodyB.isStatic ) {
            bodyB.vel.x -= normal.x * impulse / massB
            bodyB.vel.y -= normal.y * impulse / massB
        }
    }
}

type Collision = { bodyA: Body, bodyB?: Body, normal: Vector, penetration: () => number }
function generateCollisions() {
    const walls = [
        // { normal: new Vector( 0, -1 ), distance: 0 },
        { normal: new Vector( 0, 1 ), distance: canvas.height },
        // { normal: new Vector( -1, 0 ), distance: 0 },
        // { normal: new Vector( 1, 0 ), distance: canvas.width },
    ]

    let result: Collision[] = []

    for ( let i = 0; i < bodies.length; i++ ) {
        let body = bodies[ i ]
        for ( let wall of walls ) {
            let penetration = () => body.pos.dot( wall.normal ) - wall.distance + body.radius
            if ( penetration() < 0 ) continue
            result.push( {
                bodyA: body,
                normal: wall.normal,
                penetration
            } )
        }
    }

    Broadphase.findPairs( bodies, gridCellSize, ( bodyA, bodyB ) => {
        let penetration = () => bodyA.radius + bodyB.radius - bodyA.pos.distance( bodyB.pos )
        if ( penetration() < 0 ) return
        let normal = bodyB.pos.subtract( bodyA.pos ).unit()
        result.push( { bodyA, bodyB, normal, penetration } )
    } )

    return result
}