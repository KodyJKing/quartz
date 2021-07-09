import Clock from "../Clock"
import { boxPolygon, initCanvas, notQuiteInfiniteMass, polygon } from "../common"
import Body from "../dynamics/Body"
import Input from "../Input"
import Vector from "../math/Vector"
import Drawing from "../graphics/Drawing"
import PolygonCollider from "../collision/PolygonCollider"
import CircleCollider from "../collision/CircleCollider"
import ICollider from "../collision/ICollider"
import Engine from "../Engine"

const canvas = initCanvas()
const c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
const input = new Input()
const clock = new Clock()

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]
const offWhite = "#ebe6d1"
const offWhiteDarker = "#d1ccb6"
const randomColor = () => colorPalette[ Math.random() * colorPalette.length | 0 ]

const timeStep = 1
const wallThickness = 80
const engine = new Engine( {
    timeStep: 1,
    gravity: 0.07,
    linearAirDrag: 1,
    rotationalAirDrag: 1,
    linearMotionThreshold: .1,
    angularMotionThreshold: .001,
    velocitySolverOptions: {
        iterations: 30,
        minBounceVelocity: 0,
        restitution: .3,
        coefficientOfFriction: .0
    },
    positionalSolverOptions: {
        iterations: 7,
        positionalDamping: .25,
        allowedPenetration: 0
    },
    broadphaseCellSize: 100
} )

let dontRender = false
window.addEventListener( "keypress", ev => {
    if ( ev.key == " " ) dontRender = !dontRender
} )

setupBodies()
function setupBodies() {
    const staticBodies = [
        new Body( {
            collider: new PolygonCollider( boxPolygon( canvas.width, wallThickness ) ),
            position: new Vector( canvas.width / 2, canvas.height ),
            isStatic: true,
            color: offWhiteDarker
        } ),

        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( canvas.width / 2, canvas.height / 4 ),
            isStatic: true,
            color: offWhiteDarker
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( canvas.width / 2 - 200, canvas.height / 2 ),
            isStatic: true,
            color: offWhiteDarker
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( canvas.width / 2 + 200, canvas.height / 2 ),
            isStatic: true,
            color: offWhiteDarker
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( 0, canvas.height ),
            isStatic: true,
            color: offWhiteDarker
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( canvas.width, canvas.height ),
            isStatic: true,
            color: offWhiteDarker
        } )
    ]

    for ( let body of staticBodies )
        engine.bodies.push( body )

    for ( let i = 0; i < 1000; i++ ) {
        // let radius = 20 // (40 + (Math.random() - .5) * 20)
        let radius = ( Math.random() * 10 + 20 ) * .825
        let mass = radius ** 2
        let inertia = mass * radius ** 2 * .5
        let collider: ICollider
        if ( Math.random() < .5 )
            collider = new CircleCollider( radius * .8 )
        else
            collider = new PolygonCollider( polygon( Math.floor( Math.random() * 6 ) + 3, radius ) )
        engine.bodies.push( new Body( {
            collider,
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
    for ( let body of engine.bodies ) {
        if ( body.isStatic )
            continue

        // Zero-gravity when right-clicking.
        if ( input.mouse.get( 2 ) )
            body.velocity.y -= engine.options.gravity * timeStep

        // Repel when left-clicking.
        if ( input.mouse.get( 0 ) ) {
            let power = -10000
            let diff = input.cursor.subtract( body.position )
            let length = Math.max( diff.length(), 50 )
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
            body.collider.onUpdatePosition()
        }
    }
    engine.fixedUpdate()
}

function render() {
    Drawing.context = c

    c.fillStyle = offWhite
    c.fillRect( 0, 0, canvas.width, canvas.height )

    if ( !dontRender )
        engine.renderToCanvas( c )

    c.fillStyle = "red"; c.font = "24px Impact"
    c.fillText( "FPS: " + clock.averageFPS.toFixed( 2 ), 2, 22 )
    c.fillStyle = "blue"; c.font = "24px Impact"
    c.fillText( "Average penetration: " + engine.averagePenetration().toFixed( 2 ), 2, 22 * 2 )
}