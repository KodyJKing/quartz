import Clock from "../Clock"
import { boxPolygon, initCanvas } from "../common"
import Body from "../dynamics/Body"
import Input from "../Input"
import Vector from "../math/Vector"
import Drawing from "../graphics/Drawing"
import PolygonCollider from "../collision/PolygonCollider"
import CircleCollider from "../collision/CircleCollider"
import Engine from "../Engine"
import { ColorTheme, randomThemeColor } from "./ColorTheme"

const canvas = initCanvas()
const c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
const input = new Input()
const clock = new Clock()

const stepsPerFrame = 4
const timeStep = 1 / stepsPerFrame
const engine = new Engine( {
    timeStep,
    gravity: .13,
    rotationalAirDrag: 1,
    linearAirDrag: 1,
    velocitySolverOptions: {
        iterations: 20,
        minBounceVelocity: 0,
        restitution: .1,
        coefficientOfFriction: .2
    },
    positionalSolverOptions: {
        iterations: 10,
        positionalDamping: .25,
        allowedPenetration: .2
    },
    linearMotionThreshold: .1 * timeStep,
    angularMotionThreshold: .001 * timeStep,
    broadphaseCellSize: 100
} )

let dragPoint: Vector | undefined = undefined

let isPaused = false
window.addEventListener( "keydown", ev => {
    if ( ev.key == " " ) {
        isPaused = !isPaused
    } else if ( ev.key == "ArrowRight" ) {
        engine.fixedUpdate()
        render()
    } else if ( ev.key.toLocaleLowerCase() == "r" ) {
        location.reload()
    }
} )

setupBodies()
function setupBodies() {
    const wallThickness = 80
    engine.bodies.push( new Body( {
        collider: new PolygonCollider( boxPolygon( canvas.width, wallThickness ) ),
        position: new Vector( canvas.width / 2, canvas.height ),
        isStatic: true,
        color: ColorTheme.foreground
    } ) )
    // engine.bodies.push( new Body( {
    //     collider: new PolygonCollider( boxPolygon( canvas.width, wallThickness ) ),
    //     position: new Vector( canvas.width / 2, 0 ),
    //     isStatic: true,
    //     color: ColorTheme.offWhiteDarkened
    // } ) )
    // engine.bodies.push( new Body( {
    //     collider: new PolygonCollider( boxPolygon( wallThickness, canvas.height ) ),
    //     position: new Vector( canvas.width, canvas.height / 2 ),
    //     isStatic: true,
    //     color: ColorTheme.offWhiteDarkened
    // } ) )
    // engine.bodies.push( new Body( {
    //     collider: new PolygonCollider( boxPolygon( wallThickness, canvas.height ) ),
    //     position: new Vector( 0, canvas.height / 2 ),
    //     isStatic: true,
    //     color: ColorTheme.offWhiteDarkened
    // } ) )

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
                // let x0 = canvas.width / 2 - stackWidth / 2 + boxWidth / 2
                let x0 = canvas.width * 3 / 4 - stackWidth / 2 + boxWidth / 2
                engine.bodies.push( new Body( {
                    collider: new PolygonCollider( boxPolygon( w, boxHeight ) ),
                    position: new Vector(
                        x0 + j * ( boxWidth + columnPadding ) + dx,
                        canvas.height - wallThickness / 2 - boxHeight / 2 - i * boxHeight
                    ),
                    mass, inertia,
                    color: randomThemeColor()
                } ) )
            }
        }
    }
}

mainLoop()
function mainLoop() {
    clock.nextFrame()
    if ( !isPaused ) {
        render()
        for ( let i = 0; i < stepsPerFrame; i++ )
            engine.fixedUpdate()
        updateControl()
    }
    window.requestAnimationFrame( mainLoop )
}

function render() {
    Drawing.context = c
    c.fillStyle = ColorTheme.background
    c.fillRect( 0, 0, canvas.width, canvas.height )

    engine.renderToCanvas( c, { drawOutlines: true } )

    if ( dragPoint ) {
        let m = input.cursor, p = dragPoint
        Drawing.vLine( p, m ).stroke( "white" )
        let pos = p.copy(), vel = projectileVelocity() as Vector
        for ( let i = 0; i < 1000; i++ ) {
            vel = vel.addY( engine.options.gravity * timeStep )
            pos = pos.add( vel.scale( timeStep ) )
            Drawing.vCircle( pos, 2 ).fill( "white" )
        }
        Drawing.vCircle( p, 2 ).fill( "white" )
    }

    c.fillStyle = "red"; c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
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
        engine.bodies.push( projectile )
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