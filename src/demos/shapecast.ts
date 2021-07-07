import Clock from "../Clock"
import { boxPolygon, initCanvas, polygon, sampleSupport } from "../common"
import Input from "../Input"
import Matrix from "../math/Matrix"
import Vector from "../math/Vector"
import Drawing from "../graphics/Drawing"
import { shapecast } from "../collision/Collision"
import SupportFunctions, { SupportFunction } from "../math/SupportFunctions"

let canvas = initCanvas()
let c = canvas.getContext( "2d" ) as CanvasRenderingContext2D
let input = new Input()
let clock = new Clock()

const colorPalette = [ "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" ]

let paused = false
let angle = 0
window.addEventListener( "keydown", ev => {
    if ( ev.key == " " ) {
        paused = !paused
    } else if ( ev.key == "ArrowRight" ) {
        angle += .01
    } else if ( ev.key == "ArrowLeft" ) {
        angle -= .01
    }
} )

mainLoop()
function mainLoop() {
    clock.nextFrame()
    if ( !paused ) {
        render()
    }
    window.requestAnimationFrame( mainLoop )
}

function render() {
    Drawing.context = c

    c.fillStyle = "#ebe6d1"
    c.fillRect( 0, 0, canvas.width, canvas.height )

    const timeScale = .25

    let t = performance.now() / 1000
    let orbitRadius = 170

    let matA = Matrix.transformation(
        0, 0,
        Math.PI / 8 + angle, // t * timeScale,
        1, 1,
        canvas.width * .25, canvas.height * .5
    )
    let matB = Matrix.transformation(
        0, 0,
        0, // - t * 2 * timeScale,
        1, 1,
        canvas.width * .75 + Math.sin( t ) * orbitRadius * 0, canvas.height * .5 + Math.cos( t ) * orbitRadius
    )
    let polyA = polygon( 8, 100 )
    let polyB = boxPolygon( 100, 100 )
    let velA = new Vector( 1, 0 )
    let velB = new Vector( -1, 0 )
    let { transform, polygon: poly, round, translate } = SupportFunctions
    let supportA = transform( round( poly( polyA ), 20 ), matA )
    let supportB = transform( round( poly( polyB ), 20 ), matB )

    Drawing.polygon( sampleSupport( 100, supportA ) ).fill( colorPalette[ 2 ] )
    Drawing.polygon( sampleSupport( 100, supportB ) ).fill( colorPalette[ 3 ] )

    let result = shapecast( supportA, velA, supportB, velB )
    if ( result ) {
        let { time, normal } = result
        let supportA2 = translate( supportA, velA.scale( time ) )
        let supportB2 = translate( supportB, velB.scale( time ) )
        let contacts = generateContacts( supportA2, supportB2, normal )
        c.globalAlpha = .5
        Drawing.polygon( sampleSupport( 100, supportA2 ) ).fill( colorPalette[ 2 ] )
        Drawing.polygon( sampleSupport( 100, supportB2 ) ).fill( colorPalette[ 3 ] )
        c.globalAlpha = 1
        for ( let p of contacts )
            Drawing.vCircle( p, 2 ).fill( colorPalette[ 1 ] )
    }

    c.fillStyle = "red"
    c.font = "24px Impact"
    c.fillText( clock.averageFPS.toFixed( 2 ), 0 + 2, 20 + 2 )
}

function generateContacts( supportA: SupportFunction, supportB: SupportFunction, normal: Vector, angularTolerance = 0.01 ) {
    let rotator = Vector.polar( angularTolerance, 1 )
    let normalHigh = normal.complexProduct( rotator )
    let normalLow = normal.complexQuotient( rotator )

    let aUpper = supportA( normalLow )
    let aLower = supportA( normalHigh )
    let bUpper = supportB( normalHigh.negate() )
    let bLower = supportB( normalLow.negate() )

    let tangent = normal.rightNormal()
    let upperExtent = Math.min( aUpper.dot( tangent ), bUpper.dot( tangent ) )
    let lowerExtent = Math.max( aLower.dot( tangent ), bLower.dot( tangent ) )

    let aUpperContact = aUpper.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let aLowerContact = aLower.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let bUpperContact = bUpper.clampAlongAxis( tangent, lowerExtent, upperExtent )
    let bLowerContact = bLower.clampAlongAxis( tangent, lowerExtent, upperExtent )

    return [ aUpperContact, aLowerContact, bUpperContact, bLowerContact ]
}

function polySupport( poly: Vector[], mat: Matrix, radius ) {
    return ( axis: Vector ) => {
        let best = mat.multiplyVec( poly[ 0 ] )
        let bestDist = best.dot( axis )
        for ( let i = 1; i < poly.length; i++ ) {
            let next = mat.multiplyVec( poly[ i ] )
            let nextDist = next.dot( axis )
            if ( nextDist > bestDist )
                best = next, bestDist = nextDist
        }
        return best.add( axis.unit().scale( radius ) )
    }
}