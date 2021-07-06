import Clock from "../Clock"
import getCollisionPairs from "../collision/getCollisionPairs"
import Pair from "../collision/Pair"
import { boxPolygon, initCanvas, polygon, polygonPath } from "../common"
import Body from "../dynamics/Body"
import solvePositions from "../dynamics/solvePositions"
import solveVelocities from "../dynamics/solveVelocities"
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
    iterations: 100,
    minBounceVelocity: 0,
    restitution: .1,
    coefficientOfFriction: .2
}
const positionalSolverOptions = {
    iterations: 10,
    positionalDamping: .25
}

const linearMotionThreshold = .1
const angularMotionThreshold = .001

const broadphaseCellSize = 100

let dragPoint: Vector | undefined = undefined

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
    // new Body( {
    //     model: boxPolygon( canvas.width, wallThickness ),
    //     position: new Vector( canvas.width / 2, 0 ),
    //     isStatic: true,
    //     color: offWhiteDarker
    // } ),
    // new Body( {
    //     model: boxPolygon( wallThickness, canvas.height ),
    //     position: new Vector( canvas.width, canvas.height / 2 ),
    //     isStatic: true,
    //     color: offWhiteDarker
    // } ),
    // new Body( {
    //     model: boxPolygon( wallThickness, canvas.height ),
    //     position: new Vector( 0, canvas.height / 2 ),
    //     isStatic: true,
    //     color: offWhiteDarker
    // } ),
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
    let boxWidth = 120 * .8
    let boxHeight = 60 * .8
    let mass = boxWidth * boxHeight
    let inertia = mass * ( boxWidth ** 2 + boxHeight ** 2 ) / 12

    let columnPadding = 0
    let columns = 4
    let rows = 16
    let stackWidth = ( boxWidth + columnPadding ) * columns

    for ( let i = 0; i < rows; i++ ) {
        for ( let j = 0; j < columns; j++ ) {
            let dx = i % 2 == 0 ? 0 : boxWidth / 2
            let w = ( j == 0 && dx == 0 || j == ( columns - 1 ) && dx > 0 ) ? boxWidth / 2 : boxWidth
            dx += ( w == boxWidth ) ? 0 : ( w / 2 ) * ( dx == 0 ? 1 : -1 )

            // dx = 0
            // w = boxWidth

            // let x0 = canvas.width / 2 - stackWidth / 2 + boxWidth / 2
            let x0 = canvas.width * 3 / 4 - stackWidth / 2 + boxWidth / 2
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
    updatePhysics()
    updateControl()
    window.requestAnimationFrame( mainLoop )
}

function updateControl() {
    if ( input.mouse.get( 0 ) ) {
        if ( !dragPoint )
            dragPoint = input.cursor
    } else if ( dragPoint ) {
        let size = 20
        let mass = size ** 2 * 10
        let inertia = mass * size ** 2
        let position = dragPoint.copy()
        let velocity = dragPoint.subtract( input.cursor )
        const maxSpeed = 75
        const maxDraw = 200
        velocity = velocity.unit_safe().scale( Math.min( velocity.length, maxDraw ) ).scale( maxSpeed / maxDraw )
        let projectile = new Body( {
            model: polygon( 100, size ),
            position, velocity,
            mass, inertia,
            color: "#4a3648"
        } )
        bodies.push( projectile )
        dragPoint = undefined
    }
}

function updatePhysics() {
    for ( let body of bodies )
        body.updateVelocity( timeStep, gravity, rotationalAirDrag, linearAirDrag )

    pairs = getCollisionPairs( bodies, canvas.width, canvas.height, broadphaseCellSize )
    solveVelocities( pairs, velocitySolverOptions )
    solvePositions( pairs, positionalSolverOptions )

    for ( let body of bodies )
        body.updatePosition( timeStep, linearMotionThreshold, angularMotionThreshold )
}

function render() {
    Drawing.context = c

    c.fillStyle = offWhite
    c.fillRect( 0, 0, canvas.width, canvas.height )
    c.lineWidth = 2
    c.lineCap = "round"
    c.lineJoin = "round"

    for ( let body of bodies ) {
        if ( !toggleFlag )
            Drawing.polygon( body.vertices ).fill( body.color )
        Drawing.polygon( body.vertices, -2 ).stroke( body.outlineColor )

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

    if ( dragPoint ) {
        let m = input.cursor
        let p = dragPoint
        let f = p.add( p.subtract( m ).scale( 1000 ) )
        Drawing.vLine( p, m ).stroke( "white" )
        Drawing.vLine( p, f ).stroke( "rgba(255, 255, 255, .2)" )
        Drawing.vCircle( p, 2 ).fill( "white" )
    }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}