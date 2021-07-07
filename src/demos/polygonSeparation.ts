import Clock from "../Clock"
import { polygonSupport } from "../collision/Collision"
import { boxPolygon, initCanvas, polygon } from "../common"
import Input from "../Input"
import Matrix from "../math/Matrix"
import Vector from "../math/Vector"
import Drawing from "./Drawing"

let canvas = initCanvas()
let c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
let input = new Input()
let clock = new Clock()

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]

let paused = false
window.addEventListener( "keypress", ev => { if ( ev.key == " " ) paused = !paused } )

mainLoop()
function mainLoop() {
    clock.nextFrame()
    if ( !paused ) {
        render()
        update()
    }
    window.requestAnimationFrame( mainLoop )
}

function render() {
    Drawing.context = c

    c.fillStyle = "#ebe6d1"
    c.fillRect( 0, 0, canvas.width, canvas.height )

    let orbitCenter = new Vector( canvas.width / 4, canvas.height / 2 )
    let matA
    if ( input.mouse.get( 0 ) ) {
        matA = Matrix.vTranslation( input.cursor )
    } else {
        matA = [
            Matrix.vTranslation( orbitCenter ),
            Matrix.rotation( performance.now() / 1000 ),
            Matrix.translation( 200, 0 ),
            Matrix.rotation( performance.now() / 1100 ),
            // Matrix.scale( 2, 1 )
        ].reduce( ( a, b ) => a.multiply( b ) )
    }
    // let polyA = boxPolygon( 200, 200 ).map( v => matA.multiplyVec( v ) )
    let polyA = polygon( 5, 100 ).map( v => matA.multiplyVec( v ) )
    let matB = Matrix.vTranslation( orbitCenter )
    let polyB = polygon( 5, 100 ).map( v => matB.multiplyVec( v ) )

    Drawing.polygon( polyA ).fill( colorPalette[ 3 ] )
    Drawing.polygon( polyB ).fill( colorPalette[ 4 ] )

    drawGraph( polyB, polyA )

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function drawGraph( polyA: Vector[], polyB: Vector[] ) {
    let vscale = 1
    let hscale = 100

    let supportA = polygonSupport( polyA )
    let supportB = polygonSupport( polyB )

    let resolution = 1000
    let dTheta = Math.PI * 2 / resolution

    let distances: number[] = []
    for ( let i = 0; i < resolution; i++ ) {
        let theta = -dTheta * i
        let axis = Vector.polar( theta, 1 )
        let distance = supportB( axis.negate() ).dot( axis ) - supportA( axis ).dot( axis )
        distances.push( distance )
    }

    let hstride = dTheta * hscale
    let graphWidth = distances.length * hstride

    c.save()
    c.translate( canvas.width * 3 / 4 - graphWidth / 2, canvas.height / 2 )
    c.scale( 1, -1 )

    c.lineWidth = 2
    c.strokeStyle = "#d1ccb6"
    Drawing.line( 0, 0, graphWidth, 0 ).stroke()
    Drawing.line( graphWidth, -100, graphWidth, 100 ).stroke()
    Drawing.line( 0, -100, 0, 100 ).stroke()

    c.beginPath()
    c.moveTo( 0, distances[ 0 ] * vscale )
    for ( let i = 1; i < distances.length; i++ )
        c.lineTo( i * hstride, distances[ i ] * vscale )
    c.stroke()

    c.restore()
}

function update() {
}
