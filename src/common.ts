import { SupportFunction } from "./math/SupportFunctions"
import Vector from "./math/Vector"

export const notQuiteInfinite = 1e+32

export function sampleSupport( n, support: SupportFunction ) {
    let result: Vector[] = []
    for ( let i = 0; i < n; i++ ) {
        let theta = Math.PI * 2 * i / n
        result.push( support( Vector.polar( theta, 1 ) ) )
    }
    return result
}

export function polygon( n, radius ) {
    let result: Vector[] = []
    for ( let i = 0; i < n; i++ )
        result.push( new Vector(
            Math.cos( Math.PI * 2 / n * i ) * radius,
            Math.sin( Math.PI * 2 / n * i ) * radius
        ) )
    return result
}

export function boxPolygon( width, height ) {
    let rx = width / 2
    let ry = height / 2
    return [
        new Vector( -rx, -ry ),
        new Vector( rx, -ry ),
        new Vector( rx, ry ),
        new Vector( -rx, ry ),
    ]
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