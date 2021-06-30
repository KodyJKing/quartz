import Body from "../Body"
import Clock from "../Clock"
import Input from "../Input"
import { clamp } from "../math/math"
import { Vector } from "../math/Vector"
import initCanvas from "./initCanvas"

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

const staticBodyMass = 1e+32

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
                let length = Math.max( diff.length, 50 )
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

        let massA = bodyA?.mass ?? staticBodyMass
        let massB = bodyB?.mass ?? staticBodyMass

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

        let massA = bodyA?.mass ?? staticBodyMass
        let massB = bodyB?.mass ?? staticBodyMass
        let velA = bodyA.vel ?? new Vector( 0, 0 )
        let velB = bodyB?.vel ?? new Vector( 0, 0 )

        // See impulse formula here https://www.randygaul.net/2013/03/27/game-physics-engine-part-1-impulse-resolution/
        let combinedEffectiveMass = 1 / (1 / massA + 1 / massB)
        let velBA = velB.subtract(velA)
        let impulse = velBA.dot(normal) * ( 1 + restitution ) * combinedEffectiveMass

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

    generatePairCollisions( result, bodies, { pos: new Vector( 0, 0 ), size: new Vector( canvas.width, canvas.height ) }, gridCellSize )

    return result
}

function generatePairCollisions( pairs: Collision[], bodies: Body[], box: { pos: Vector, size: Vector }, cellSize: number ) {
    let gridWidth = Math.ceil( canvas.width / cellSize )
    let gridHeight = Math.ceil( canvas.height / cellSize )
    type GridCell = Body[]
    const grid: GridCell[] = []
    for ( let i = 0; i < gridWidth * gridHeight; i++ )
        grid.push( [] )

    // Place bodies in grid.
    for ( let body of bodies ) {
        let { pos, radius: r } = body
        let { x, y } = pos
        // This is slightly incorrect since it will place bodies outside the grid on the boundary of the grid.
        // However this has the benefit of ensuring all bodies will be covered by collision detection.
        // TODO: Come up with a cleaner solution. Maybe implement chunks and generate chunks adaptively rather than going off of screen dimensions.
        let i1 = clamp( 0, gridWidth - 1, Math.floor( ( x - r ) / cellSize ) )
        let i2 = clamp( 0, gridWidth - 1, Math.floor( ( x + r ) / cellSize ) )
        let j1 = clamp( 0, gridHeight - 1, Math.floor( ( y - r ) / cellSize ) )
        let j2 = clamp( 0, gridHeight - 1, Math.floor( ( y + r ) / cellSize ) )
        for ( let i = i1; i <= i2; i++ ) {
            for ( let j = j1; j <= j2; j++ ) {
                let cellIndex = i * gridHeight + j
                grid[ cellIndex ].push( body )
            }
        }
    }

    let visitedPairs = new Set<number>()

    // Iterate over grid to generate pairs.
    for ( let i = 0; i < gridWidth; i++ ) {
        for ( let j = 0; j < gridHeight; j++ ) {
            let cellIndex = i * gridHeight + j

            let gridCell = grid[ cellIndex ]
            for ( let iBodyA = 0; iBodyA < gridCell.length; iBodyA++ ) {
                let bodyA = gridCell[ iBodyA ]
                for ( let iBodyB = iBodyA + 1; iBodyB < gridCell.length; iBodyB++ ) {
                    let bodyB = gridCell[ iBodyB ]

                    let penetration = () => bodyA.radius + bodyB.radius - bodyA.pos.distance( bodyB.pos )
                    if ( penetration() < 0 ) continue

                    let minId = Math.min( bodyA.id, bodyB.id )
                    let maxId = Math.max( bodyA.id, bodyB.id )
                    let pairKey = ( maxId << 16 ) | minId

                    if ( visitedPairs.has( pairKey ) ) continue
                    visitedPairs.add( pairKey )

                    let normal = bodyB.pos.subtract( bodyA.pos ).unit()
                    pairs.push( { bodyA, bodyB, normal, penetration } )
                }
            }

        }
    }

}

