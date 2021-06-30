import { Vector } from "./math/Vector"

export const notQuiteInfiniteMass = 1e+32

export function polygon( n, radius ) {
    let result: Vector[] = []
    for ( let i = 0; i < n; i++ )
        result.push( new Vector(
            Math.cos( Math.PI * 2 / n * i ) * radius,
            Math.sin( Math.PI * 2 / n * i ) * radius
        ) )
    return result
}

export function boxPolygon(width, height) {
    let rx = width / 2
    let ry = height / 2
    return [
        new Vector(-rx, -ry),
        new Vector(rx, -ry),
        new Vector(rx, ry),
        new Vector(-rx, ry),
    ]
}

export function polygonPath( c: CanvasRenderingContext2D, poly: Vector[] ) {
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

export function initCanvas() {
    let canvas = document.getElementById( "mainCanvas" ) as HTMLCanvasElement
    updateCanvasResolution()
    window.addEventListener( "resize", ev => updateCanvasResolution() )
    function updateCanvasResolution() {
        let rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
    }
    return canvas
}