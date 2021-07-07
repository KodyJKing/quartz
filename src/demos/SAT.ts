import Clock from "../Clock"
import { getCollisionPairs, SAT } from "../collision/Collision"
import { initCanvas, polygon } from "../common"
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

    let { x, y } = input.cursor
    // let matA = Matrix.transformation( 0, 0, Math.PI / 4, 1, 1, x, y )
    let matA = [
        Matrix.translation( 500, 500 ),
        Matrix.rotation( performance.now() / 1000 ),
        Matrix.translation( 200, 0 ),
        Matrix.rotation( performance.now() / 1100 ),
        Matrix.scale( 2, 1 )
    ].reduce( ( a, b ) => a.multiply( b ) )
    let polyA = [
        new Vector( -100, -100 ),
        new Vector( 100, -100 ),
        new Vector( 100, 100 ),
        new Vector( -100, 100 ),
    ].map( v => matA.multiplyVec( v ) )
    let matB = Matrix.translation( 500, 500 )
    let polyB = polygon( 6, 50 ).map( v => matB.multiplyVec( v ) )

    let contactInfo = SAT( polyA, polyB )

    if ( contactInfo.separation <= 0 )
        c.globalAlpha = .5
    Drawing.polygon( polyA ).fill( colorPalette[ 3 ] )
    Drawing.polygon( polyB ).fill( colorPalette[ 4 ] )
    c.globalAlpha = 1

    for ( let v of contactInfo.contact )
        Drawing.vCircle( v, 4 ).fill( colorPalette[ 1 ] )

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function update() {
}
