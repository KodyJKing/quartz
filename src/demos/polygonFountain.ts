import Clock from "../Clock"
import getCollisionPairs from "../collision/getCollisionPairs"
import Pair from "../collision/Pair"
import { boxPolygon, initCanvas, polygon, polygonPath } from "../common"
import Body from "../dynamics/Body"
import solvePositions from "../dynamics/solvePositions"
import solveVelocities from "../dynamics/solveVelocities"
import Color, { Colors } from "../graphics/Color"
import Input from "../Input"
import Vector from "../math/Vector"
import Drawing from "./Drawing"

const canvas = initCanvas()
const c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
const input = new Input()
const clock = new Clock()

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]
const offWhite = "#ebe6d1"
const offWhiteDarker = "#d1ccb6"
const randomColor = () => colorPalette[ Math.random() * colorPalette.length | 0 ]

const timeStep = 1
const gravity = .13
const rotationalAirDrag = 1 // .99
const linearAirDrag = 1 // .99
const wallThickness = 80

const velocitySolverOptions = {
    iterations: 30,
    minBounceVelocity: 0,
    restitution: .1,
    coefficientOfFriction: .0
}
const positionalSolverOptions = {
    iterations: 10,
    positionalDamping: .25,
    allowedPenetration: 0
}

const broadphaseCellSize = 200

let toggleFlag = false
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
        model: polygon( 50, 100 ),
        position: new Vector( canvas.width / 2, canvas.height / 4 ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    new Body( {
        model: polygon( 50, 100 ),
        position: new Vector( canvas.width / 2 - 200, canvas.height / 2 ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    new Body( {
        model: polygon( 50, 100 ),
        position: new Vector( canvas.width / 2 + 200, canvas.height / 2 ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    new Body( {
        model: polygon( 50, 100 ),
        position: new Vector( 0, canvas.height ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    new Body( {
        model: polygon( 50, 100 ),
        position: new Vector( canvas.width, canvas.height ),
        isStatic: true,
        color: offWhiteDarker
    } ),
]

addRandomShapes()
function addRandomShapes() {
    for ( let i = 0; i < 1000; i++ ) {
        let radius = 20 // (40 + (Math.random() - .5) * 20)
        let mass = radius ** 2
        let inertia = mass * radius ** 2 * .5
        bodies.push( new Body( {
            model: polygon( Math.floor( Math.random() * 6 ) + 3, radius ),
            // model: polygon( 5, radius ),
            position: new Vector( Math.random() * canvas.width, Math.random() * canvas.height ),
            angularVelocity: ( Math.random() - .5 ),
            velocity: Vector.polar( Math.random() * Math.PI * 2, Math.random() * 20 ),
            mass, inertia,
            color: randomColor()
        } ) )
    }
}

mainLoop()
function mainLoop() {
    clock.nextFrame()
    render()
    update()
    window.requestAnimationFrame( mainLoop )
}

function update() {
    for ( let body of bodies ) {
        if ( body.isStatic )
            continue

        body.updateVelocity( timeStep, gravity, rotationalAirDrag, linearAirDrag )

        // Zero-gravity when right-clicking.
        if ( input.mouse.get( 2 ) )
            body.velocity.y -= gravity * timeStep

        // Repel when left-clicking.
        if ( input.mouse.get( 0 ) ) {
            let power = -10000
            let diff = input.cursor.subtract( body.position )
            let length = Math.max( diff.length, 50 )
            diff = diff.scale( power / length ** 3 )
            body.velocity.x += diff.x * timeStep
            body.velocity.y += diff.y * timeStep
        }

        // Reset bodies which are out of bounds.
        let x = body.position.x
        let width = canvas.width
        let marigin = 80
        if ( x < -marigin || x > width + marigin ) {
            body.position.y = -200
            body.position.x = width / 2
            body.velocity.x = 0
            body.velocity.y = 0
        }
    }

    pairs = getCollisionPairs( bodies, canvas.width, canvas.height, broadphaseCellSize )
    solveVelocities( pairs, velocitySolverOptions )
    solvePositions( pairs, positionalSolverOptions )

    for ( let body of bodies )
        body.updatePosition( timeStep )
}

function render() {
    Drawing.context = c

    c.fillStyle = offWhite
    c.fillRect( 0, 0, canvas.width, canvas.height )
    c.lineWidth = 2
    c.lineCap = "round"
    c.lineJoin = "round"

    if ( !toggleFlag )
        for ( let body of bodies ) {
            Drawing.polygon( body.vertices, -1 ).fill( body.color )
            // Drawing.stroke( body.outlineColor )

            // let p = body.position
            // Drawing.circle( p, 3 ).fill( offWhite )
            // let h = Vector.polar( body.angle, 10 )
            // Drawing.line( p, p.add( h ) ).stroke( offWhite )
        }

    // for ( let pair of pairs ) {
    //     let n = pair.info.normal.scale( 5 )
    //     for ( let p of pair.info.contact ) {
    //         Drawing.circle( p, 2 ).fill( offWhite )
    //         Drawing.line( p.subtract( n ), p.add( n ) ).stroke( "rgba(255, 255, 255, .5)" )
    //     }
    // }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( "FPS: " + clock.averageFPS.toFixed( 2 ), 2, 22 )

    if ( pairs.length > 0 ) {
        let netPenetration = pairs.map( x => Math.max( 0, -x.info.separation ) ).reduce( ( a, b ) => a + b )
        let avergaePenetration = netPenetration / pairs.length
        c.fillStyle = "blue"
        c.font = "24px Impact"
        c.fillText( "Average penetration: " + avergaePenetration.toFixed( 2 ), 2, 22 * 2 )
    }
}