import Clock from "../Clock"
import { getCollisionPairs, Pair } from "../collision/Collision"
import { boxPolygon, initCanvas, polygon } from "../common"
import Body from "../dynamics/Body"
import solvePositions from "../dynamics/solvePositions"
import solveVelocities from "../dynamics/solveVelocities"
import Input from "../Input"
import Vector from "../math/Vector"
import Drawing from "../graphics/Drawing"
import PolygonCollider from "../collision/PolygonCollider"
import CircleCollider from "../collision/CircleCollider"

const canvas = initCanvas()
const c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
const input = new Input()
const clock = new Clock()

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]
const offWhite = "#ebe6d1"
const offWhiteDarker = "#d1ccb6"
const randomColor = () => colorPalette[ Math.random() * colorPalette.length | 0 ]

const stepsPerFrame = 4
const timeStep = 1 / stepsPerFrame
const gravity = .13
const rotationalAirDrag = 1 // .99
const linearAirDrag = 1 // .99
const wallThickness = 80

const velocitySolverOptions = {
    iterations: 20,
    minBounceVelocity: 0,
    restitution: .1,
    coefficientOfFriction: .2
}
const positionalSolverOptions = {
    iterations: 10,
    positionalDamping: .25,
    allowedPenetration: .2
}

const linearMotionThreshold = .1 * timeStep
const angularMotionThreshold = .001 * timeStep

const broadphaseCellSize = 100

let dragPoint: Vector | undefined = undefined

let toggleFlag = false
window.addEventListener( "keydown", ev => {
    if ( ev.key == " " ) {
        toggleFlag = !toggleFlag
    } else if ( ev.key == "ArrowRight" ) {
        updatePhysics()
        render()
    } else if ( ev.key.toLocaleLowerCase() == "r" ) {
        location.reload()
    }
} )

let pairs: Pair[] = []
const bodies: Body[] = [
    new Body( {
        collider: new PolygonCollider( boxPolygon( canvas.width, wallThickness ) ),
        position: new Vector( canvas.width / 2, canvas.height ),
        isStatic: true,
        color: offWhiteDarker
    } ),
    // new Body( {
    //     collider: new PolygonCollider( boxPolygon( canvas.width, wallThickness ) ),
    //     position: new Vector( canvas.width / 2, 0 ),
    //     isStatic: true,
    //     color: offWhiteDarker
    // } ),
    // new Body( {
    //     collider: new PolygonCollider( boxPolygon( wallThickness, canvas.height ) ),
    //     position: new Vector( canvas.width, canvas.height / 2 ),
    //     isStatic: true,
    //     color: offWhiteDarker
    // } ),
    // new Body( {
    //     collider: new PolygonCollider( boxPolygon( wallThickness, canvas.height ) ),
    //     position: new Vector( 0, canvas.height / 2 ),
    //     isStatic: true,
    //     color: offWhiteDarker
    // } ),
]

addStack()
function addStack() {
    let boxWidth = 120 * .8
    let boxHeight = 60 * .8
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

            let mass = w * boxHeight
            let inertia = mass * ( w ** 2 + boxHeight ** 2 ) / 12

            let x0 = canvas.width / 2 - stackWidth / 2 + boxWidth / 2
            // let x0 = canvas.width * 3 / 4 - stackWidth / 2 + boxWidth / 2
            bodies.push( new Body( {
                collider: new PolygonCollider( boxPolygon( w, boxHeight ) ),
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
    if ( !toggleFlag ) {
        render()
        for ( let i = 0; i < stepsPerFrame; i++ )
            updatePhysics()
        updateControl()
    }
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
        let velocity = projectileVelocity()
        let projectile = new Body( {
            collider: new CircleCollider( size ),
            position, velocity,
            mass, inertia,
            color: "#4a3648"
        } )
        bodies.push( projectile )
        dragPoint = undefined
    }
}

function projectileVelocity() {
    if ( !dragPoint )
        return
    const maxSpeed = 75
    const maxDraw = 250
    let velocity = dragPoint.subtract( input.cursor )
    return velocity.unit().scale( Math.min( velocity.length(), maxDraw ) ).scale( maxSpeed / maxDraw )
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

    // if ( toggleFlag )
    //     c.globalAlpha = .7
    c.fillStyle = offWhite
    c.fillRect( 0, 0, canvas.width, canvas.height )
    // c.globalAlpha = 1
    c.lineWidth = 2
    c.lineCap = "round"
    c.lineJoin = "round"

    for ( let body of bodies ) {
        if ( body.collider instanceof PolygonCollider ) {
            Drawing.polygon( body.collider.vertices ).fill( body.color )
            Drawing.polygon( body.collider.vertices, -2.5 ).stroke( body.outlineColor )
        } else if ( body.collider instanceof CircleCollider ) {
            Drawing.vCircle( body.position, body.collider.radius ).fill( body.color )
            Drawing.vCircle( body.position, body.collider.radius - 2.5 ).stroke( body.outlineColor )
        }

        // let p = body.position
        // Drawing.circle( p, 3 ).fill( offWhite )
        // let h = Vector.polar( body.angle, 10 )
        // Drawing.line( p, p.add( h ) ).stroke( offWhite )
    }

    // for ( let pair of pairs ) {
    //     let n = pair.info.normal.scale( 5 )
    //     for ( let p of pair.info.contact ) {
    //         Drawing.vCircle( p, 2 ).fill( offWhite )
    //         Drawing.vLine( p.subtract( n ), p.add( n ) ).stroke( "rgba(255, 255, 255, .5)" )
    //     }
    // }

    if ( dragPoint ) {
        let m = input.cursor
        let p = dragPoint
        Drawing.vLine( p, m ).stroke( "white" )

        let pos = p.copy()
        let vel = projectileVelocity() as Vector
        for ( let i = 0; i < 1000; i++ ) {
            vel = vel.addY( gravity * timeStep )
            pos = pos.add( vel.scale( timeStep ) )
            Drawing.vCircle( pos, 2 ).fill( "white" )
        }

        Drawing.vCircle( p, 2 ).fill( "white" )
    }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}