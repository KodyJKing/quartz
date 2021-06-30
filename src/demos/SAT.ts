import { markAsUntransferable } from "worker_threads"
import Clock from "../Clock"
import SAT from "../collision/SAT"
import Input from "../Input"
import Matrix from "../math/Matrix"
import { Vector } from "../math/Vector"
import initCanvas from "./initCanvas"

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

function polyPath( poly: Vector[] ) {
    if ( poly.length == 0 )
        return
    let pt = poly[ 0 ]
    c.beginPath()
    c.moveTo( pt.x, pt.y )
    for ( let i = 1; i < poly.length; i++ ) {
        pt = poly[ i ]
        c.lineTo( pt.x, pt.y )
    }
    c.closePath()
}

function poly( n ) {
    let result: Vector[] = []
    for ( let i = 0; i < n; i++ )
        result.push( new Vector(
            Math.cos( Math.PI * 2 / n * i ),
            Math.sin( Math.PI * 2 / n * i )
        ) )
    return result
}

function render() {
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

    let matB = Matrix.transformation( 0, 0, 0, 50, 50, 500, 500 )
    // let polyB = [
    //     new Vector( -100, -100 ),
    //     new Vector( 100, -100 ),
    //     new Vector( 100, 100 ),
    //     new Vector( -100, 100 ),
    // ].map( v => matB.multiplyVec( v ) )
    let polyB = poly( 20 ).map( v => matB.multiplyVec( v ) )

    let contactInfo = SAT( polyA, polyB )
    let { a, b } = contactInfo.contact

    if ( contactInfo.separation <= 0 )
        c.globalAlpha = .5

    polyPath( polyA )
    c.fillStyle = colorPalette[ 3 ]
    c.fill()

    polyPath( polyB )
    c.fillStyle = colorPalette[ 4 ]
    c.fill()

    c.globalAlpha = 1

    for ( let v of [ a.high, a.low, b.high, b.low ] ) {
        c.beginPath()
        c.arc( v.x, v.y, 4, 0, Math.PI * 2 )
        c.fillStyle = colorPalette[ 1 ]
        c.fill()
    }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function update() {
}
