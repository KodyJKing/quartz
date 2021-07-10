import Clock from "../Clock"
import { boxPolygon, initCanvas, polygon } from "../common"
import Body from "../dynamics/Body"
import Input from "../Input"
import Vector from "../math/Vector"
import Drawing from "../graphics/Drawing"
import PolygonCollider from "../collision/PolygonCollider"
import CircleCollider from "../collision/CircleCollider"
import ICollider from "../collision/ICollider"
import Engine from "../Engine"
import Camera from "../graphics/Camera"
import { ColorTheme, randomThemeColor } from "./ColorTheme"

const canvas = initCanvas()
const c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
const input = new Input()
const clock = new Clock()

const wallThickness = 80
const worldWidth = canvas.width
const worldHeight = canvas.height
const camera = new Camera()
let dontRender = false
camera.position = new Vector( worldWidth / 2, worldHeight / 2 )


const timeStep = 1
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

window.addEventListener( "keypress", ev => {
    if ( ev.key == " " ) dontRender = !dontRender
} )

setupBodies()
function setupBodies() {
    const staticBodies = [
        new Body( {
            collider: new PolygonCollider( boxPolygon( worldWidth, wallThickness ) ),
            position: new Vector( worldWidth / 2, worldHeight ),
            isStatic: true,
            color: ColorTheme.foreground
        } ),

        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( worldWidth / 2, worldHeight / 4 ),
            isStatic: true,
            color: ColorTheme.foreground
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( worldWidth / 2 - 200, worldHeight / 2 ),
            isStatic: true,
            color: ColorTheme.foreground
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( worldWidth / 2 + 200, worldHeight / 2 ),
            isStatic: true,
            color: ColorTheme.foreground
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( 0, worldHeight ),
            isStatic: true,
            color: ColorTheme.foreground
        } ),
        new Body( {
            collider: new CircleCollider( 100 ),
            position: new Vector( worldWidth, worldHeight ),
            isStatic: true,
            color: ColorTheme.foreground
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
            position: new Vector( Math.random() * worldWidth, Math.random() * worldHeight ),
            angularVelocity: ( Math.random() - .5 ),
            velocity: Vector.polar( Math.random() * Math.PI * 2, Math.random() * 20 ),
            mass, inertia,
            color: randomThemeColor()
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
    camera.updateFromInput( input )

    for ( let body of engine.bodies ) {
        if ( body.isStatic )
            continue

        // Zero-gravity when right-clicking.
        if ( input.mouse.get( 2 ) )
            body.velocity.y -= engine.options.gravity * timeStep

        // Repel when left-clicking.
        if ( input.mouse.get( 0 ) ) {
            let mousePos = camera.worldPosition( canvas.width, canvas.height, input.cursor )
            let power = -10000
            let diff = mousePos.subtract( body.position )
            let length = Math.max( diff.length(), 50 )
            diff = diff.scale( power / length ** 3 )
            body.velocity.x += diff.x * timeStep
            body.velocity.y += diff.y * timeStep
        }

        // Reset bodies which are out of bounds.
        let x = body.position.x
        let width = worldWidth
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
    c.fillStyle = ColorTheme.background
    c.fillRect( 0, 0, canvas.width, canvas.height )

    Drawing.save()
    Drawing.mTransform( camera.worldToCamera( canvas.width, canvas.height ) )
    if ( !dontRender )
        engine.renderToCanvas( c )
    Drawing.restore()

    c.fillStyle = "red"; c.font = "24px Impact"
    c.fillText( "FPS: " + clock.averageFPS.toFixed( 2 ), 2, 22 )
    c.fillStyle = "blue"; c.font = "24px Impact"
    c.fillText( "Average penetration: " + engine.averagePenetration().toFixed( 2 ), 2, 22 * 2 )
}