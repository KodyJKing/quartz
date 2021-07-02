import { modulus } from "./math/math"
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

export function polygonPath( c: CanvasRenderingContext2D, poly: Vector[], padding = 0 ) {
    if ( poly.length == 0 )
        return
    const getPoint = i => { 
        let p0 = poly[modulus(i - 1, poly.length)]
        let p1 = poly[i]
        let p2 = poly[(i + 1) % poly.length]
        let tangent1 = p1.subtract(p0).unit()
        let tangent2 = p2.subtract(p1).unit()
        let midNormal = tangent1.lerp(tangent2, .5).rightNormal().unit()
        return p1.add(midNormal.scale(padding))
    }
    let pt = getPoint(0)
    c.beginPath()
    c.moveTo( pt.x, pt.y )
    for ( let i = 1; i < poly.length; i++ ) {
        pt = getPoint(i)
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