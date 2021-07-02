import Clock from "../../Clock"
import Broadphase from "../../collision/Broadphase"
import SAT, { CollisionInfo } from "../../collision/SAT"
import { boxPolygon, initCanvas, polygon, polygonPath, notQuiteInfiniteMass } from "../../common"
import Input from "../../Input"
import { Vector } from "../../math/Vector"
import Body from "./Body"
import { applyPositionalCorrections, solvePositions } from "./solvePositions"
import { solveVelocities } from "./solveVelocities"

const canvas = initCanvas()
const c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
const input = new Input()
const clock = new Clock()

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]
const offWhite = "#ebe6d1"
const offWhiteDarker = "#d1ccb6"
const randomColor = () => colorPalette[ Math.random() * colorPalette.length | 0 ]

const timeStep = 1 / 120
const gravity = 2000
const coefficientOfFriction = 0 // .1
const rotationalAirDrag = .99
const linearAirDrag = .99

const positionalIterations = 10
const positionalDamping = .25
const updateGeometryAndCollision = false
const positionalWarming = .8

const velocityIterations = 10
const restitution = 0.1
const minBounceVelocity = 0 // 400

const wallThickness = 80

const broadphaseCellSize = 100

let toggleFlag = true
window.addEventListener( "keypress", ev => {
    if ( ev.key == " " ) {
        toggleFlag = !toggleFlag
        console.log( { toggleFlag } )
    }
} )

let pairs: Pair[] = []
const bodies: Body[] = [
    new Body( {
        model: boxPolygon( canvas.width, wallThickness ),
        position: new Vector( canvas.width / 2, canvas.height ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    new Body( {
        model: boxPolygon( canvas.width, wallThickness ),
        position: new Vector( canvas.width / 2, 0 ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    new Body( {
        model: boxPolygon( wallThickness, canvas.height ),
        position: new Vector( canvas.width, canvas.height / 2 ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    new Body( {
        model: boxPolygon( wallThickness, canvas.height ),
        position: new Vector( 0, canvas.height / 2 ),
        isStatic: true,
        color: offWhiteDarker
    } ),
]

// addRandomShapes()
function addRandomShapes() {
    for ( let i = 0; i < 100; i++ ) {
        let radius = 50
        // let radius = ( 60 + ( Math.random() - .5 ) * 20 )
        let mass = radius ** 2 / ( 50 * 50 )
        let inertia = mass * radius ** 2 * .5
        bodies.push( new Body( {
            model: polygon( Math.floor( Math.random() * 6 ) + 3, radius ),
            // model: polygon( 4, radius ),
            position: new Vector( Math.random() * canvas.width, Math.random() * canvas.height ),
            angularVelocity: ( Math.random() - .5 ) * 100,
            // angle: Math.PI / 4,
            velocity: Vector.polar( Math.random() * Math.PI * 2, Math.random() * 2000 ),
            mass, inertia,
            color: randomColor()
        } ) )
    }
}

addStack()
function addStack() {
    let size = 80
    let rows = 10
    let columns = 3
    let width = columns * ( size + 1 )
    for ( let i = 0; i < rows; i++ ) {
        for ( let j = 0; j < columns; j++ ) {
            let mass = size ** 2 / ( 50 * 50 )
            let inertia = mass * size ** 2 * .5
            bodies.push( new Body( {
                model: boxPolygon( size, size ),
                position: new Vector( canvas.width / 2 + j * ( size + 1 ) - width / 2, canvas.height - wallThickness / 2 - size / 2 - i * size ),
                mass, inertia,
                color: randomColor()
            } ) )
        }
    }
}

mainLoop()
function mainLoop() {
    clock.nextFrame()
    render()
    update()
    window.requestAnimationFrame( mainLoop )
}

function render() {
    c.fillStyle = offWhite
    c.fillRect( 0, 0, canvas.width, canvas.height )
    c.lineWidth = 1
    c.lineCap = "round"
    c.lineJoin = "round"

    for ( let body of bodies ) {
        polygonPath( c, body.vertices )
        c.fillStyle = body.color; c.fill()
        if ( !body.isStatic ) {
            polygonPath( c, body.vertices, -c.lineWidth )
            c.strokeStyle = body.outlineColor
            c.stroke()
        }

        // let p = body.position
        // c.beginPath()
        // c.arc( p.x, p.y, 4, 0, Math.PI * 2 )
        // c.fillStyle = offWhite; c.fill()

        // let h = Vector.polar( body.angle, 20 )
        // c.beginPath()
        // c.moveTo( p.x, p.y )
        // c.lineTo( p.x + h.x, p.y + h.y )
        // c.strokeStyle = offWhite; c.stroke()
    }

    // for ( let pair of pairs ) {
    //     let n = pair.info.normal.scale( 5 )
    //     for ( let p of pair.info.contact ) {
    //         c.beginPath()
    //         c.arc( p.x, p.y, 2, 0, Math.PI * 2 )
    //         c.fillStyle = offWhite; c.fill()
    //         c.beginPath()
    //         c.moveTo( p.x - n.x, p.y - n.y )
    //         c.lineTo( p.x + n.x, p.y + n.y )
    //         c.strokeStyle = "rgba(255, 255, 255, .5)"
    //         c.stroke()
    //     }
    // }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function update() {
    for ( let body of bodies ) {
        if ( body.isStatic )
            continue

        if ( !input.mouse.get( 2 ) )
            body.velocity.y += gravity * timeStep
        if ( input.mouse.get( 0 ) ) {
            let diff = input.cursor.subtract( body.position )
            let length = Math.max( diff.length, 50 )
            diff = diff.scale( -250000000 / length ** 3 )
            body.velocity.x += diff.x * timeStep
            body.velocity.y += diff.y * timeStep
        }

        body.angularVelocity *= rotationalAirDrag
        body.velocity.x *= linearAirDrag
        body.velocity.y *= linearAirDrag
    }

    pairs = generatePairs()
    let velocitySolverOptions = { minBounceVelocity, restitution, coefficientOfFriction, solvePairs: toggleFlag }
    let positionalSolverOptions = { positionalDamping, updateGeometryAndCollision }
    for ( let i = 0; i < velocityIterations; i++ )
        solveVelocities( pairs, velocitySolverOptions )
    for ( let i = 0; i < positionalIterations; i++ )
        solvePositions( pairs, positionalSolverOptions )
    applyPositionalCorrections( bodies, positionalWarming )

    // if ( pairs.length > 0 ) {
    //     let netPenetration = pairs.map( x => Math.max( 0, -x.info.separation ) ).reduce( ( a, b ) => a + b )
    //     console.log( "Net penetration: " + netPenetration.toFixed( 2 ) )
    // }

    for ( let body of bodies ) {
        if ( body.isStatic )
            continue
        body.position.x += body.velocity.x * timeStep
        body.position.y += body.velocity.y * timeStep
        body.angle += body.angularVelocity * timeStep
        body.updateVertices()
        body.healthCheck()
    }

}

export type Pair = { bodyA: Body, bodyB: Body, info: CollisionInfo }
function generatePairs() {
    let pairs: Pair[] = []
    Broadphase.findPairs(
        bodies, canvas.width, canvas.height, broadphaseCellSize,
        ( bodyA, bodyB ) => {
            if ( bodyA.isStatic && bodyB.isStatic )
                return
            let info = SAT( bodyA.vertices, bodyB.vertices )
            if ( info.separation <= 0 )
                pairs.push( { bodyA, bodyB, info } )
        }
    )
    return pairs
}
