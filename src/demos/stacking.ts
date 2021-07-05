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
    iterations: 100,
    minBounceVelocity: 0,
    restitution: .0,
    coefficientOfFriction: .2
}
const positionalSolverOptions = {
    iterations: 10,
    positionalDamping: .25
}

const broadphaseCellSize = 100

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
    for ( let i = 0; i < 300; i++ ) {
        let radius = 30 // (40 + (Math.random() - .5) * 20)
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

addStack()
function addStack() {
    let factor = 16 / 14

    let boxWidth = 120 / factor
    let boxHeight = 60 / factor
    let mass = boxWidth * boxHeight
    let inertia = mass * ( boxWidth ** 2 + boxHeight ** 2 ) / 12

    let columnPadding = 1
    let columns = 14 * factor
    let rows = 14 * factor
    let stackWidth = ( boxWidth + columnPadding ) * columns

    for ( let i = 0; i < rows; i++ ) {
        for ( let j = 0; j < columns; j++ ) {
            let dx = i % 2 == 0 ? 0 : boxWidth / 2
            let w = ( j == 0 && dx == 0 || j == columns - 1 && dx > 0 ) ? boxWidth / 2 : boxWidth
            dx += ( w == boxWidth ) ? 0 : ( w / 2 ) * ( dx == 0 ? 1 : -1 )

            // dx = 0
            // w = boxWidth

            let x0 = canvas.width / 2 - stackWidth / 2 + boxWidth / 2
            bodies.push( new Body( {
                model: boxPolygon( w, boxHeight ),
                position: new Vector(
                    x0 + j * ( boxWidth + columnPadding ) + dx,
                    canvas.height - wallThickness / 2 - boxHeight / 2 - i * boxHeight
                ),
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
    }

    pairs = getCollisionPairs( bodies, canvas.width, canvas.height, broadphaseCellSize )
    solveVelocities( pairs, velocitySolverOptions )
    solvePositions( pairs, positionalSolverOptions )

    for ( let body of bodies )
        body.updatePosition( timeStep )
}

function render() {
    c.fillStyle = offWhite
    c.fillRect( 0, 0, canvas.width, canvas.height )
    c.lineWidth = 2
    c.lineCap = "round"
    c.lineJoin = "round"

    for ( let body of bodies ) {
        if ( !toggleFlag ) {
            polygonPath( c, body.vertices )
            c.fillStyle = body.color; c.fill()
        }
        polygonPath( c, body.vertices, -2 )
        // c.strokeStyle = Color.parse( body.color ).lerp( Colors.black, .025 ).toString()
        c.strokeStyle = body.outlineColor
        c.stroke()

        // let p = body.position
        // c.beginPath()
        // c.arc( p.x, p.y, 4, 0, Math.PI * 2 )
        // c.fillStyle = "blue"; c.fill()

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

    // let m = input.cursor
    // c.beginPath()
    // c.arc( m.x, m.y, 50, 0, Math.PI * 2 )
    // c.strokeStyle = "red"; c.stroke()

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}