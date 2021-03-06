import Clock from "../Clock"
import { polygonVsPolygon } from "../collision/Collision"
import { boxPolygon, initCanvas, polygon } from "../common"
import Input from "../Input"
import Matrix from "../math/Matrix"
import Vector from "../math/Vector"
import Drawing from "../graphics/Drawing"
import { ColorTheme } from "./ColorTheme"

let canvas = initCanvas()
let c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
let input = new Input()
let clock = new Clock()

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

    c.lineWidth = 2
    c.lineCap = "round"

    c.fillStyle = ColorTheme.background
    c.fillRect( 0, 0, canvas.width, canvas.height )

    let t = performance.now() / 1000
    let timeScale = 0.25

    let { x, y } = input.cursor
    // let matA = Matrix.transformation( 0, 0, Math.PI / 4, 1, 1, x, y )
    let matA = [
        Matrix.translation( 500, 500 ),
        Matrix.rotation( t * timeScale ),
        Matrix.translation( 130, 0 ),
        Matrix.rotation( t * timeScale / 1.1 ),
        Matrix.scale( 1, 1 )
    ].reduce( ( a, b ) => a.multiply( b ) )
    let polyA = boxPolygon( 200, 200 ).map( v => matA.multiplyVec( v ) )
    let matB = Matrix.transformation( 0, 0, Math.PI / 6, 1, 1, 500, 500 )
    let polyB = polygon( 6, 50 ).map( v => matB.multiplyVec( v ) )

    let contactInfo = polygonVsPolygon( polyA, polyB )
    let isTouching = contactInfo.separation <= 0

    if ( isTouching )
        c.globalAlpha = .5
    Drawing.polygon( polyA ).fill( ColorTheme.accents.accent3Light )
    Drawing.polygon( polyB ).fill( ColorTheme.accents.accent3Dark )
    c.globalAlpha = 1

    if ( isTouching ) {
        for ( let v of contactInfo.contact ) {
            Drawing.vCircle( v, 4 ).fill( ColorTheme.accents.accent1Light )
            Drawing.vLine( v, v.add( contactInfo.normal.scale( 10 ) ) ).stroke( ColorTheme.accents.accent1Light )
        }
    }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function update() {
}
