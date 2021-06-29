import { Vector } from "./Vector"

const epsilon = 0.00001

export function equals( a: number, b: number ) {
    return Math.abs( a - b ) < epsilon
}

export function randomFloor( upperLimit: number ) {
    return Math.floor( Math.random() * upperLimit )
}

export class AABB {
    minx: number
    miny: number
    maxx: number
    maxy: number

    constructor( minx: number, miny: number, maxx: number, maxy: number ) {
        this.minx = minx
        this.miny = miny
        this.maxx = maxx
        this.maxy = maxy
    }

    static fromDimensions( pos: Vector, dimensions: Vector ) {
        return new AABB( pos.x, pos.y, pos.x + dimensions.x, pos.y + dimensions.y )
    }

    hull( a: AABB, b: AABB ) {
        function min( x, y ) { return Math.min( x, y ) }
        function max( x, y ) { return Math.max( x, y ) }
        return new AABB(
            min( a.minx, b.minx ),
            min( a.miny, b.miny ),
            max( a.maxx, b.maxx ),
            max( a.maxy, b.maxy ),
        )
    }

    contains( p: Vector ) {
        let { minx, miny, maxx, maxy } = this
        return p.x >= minx && p.x <= maxx && p.y >= miny && p.y <= maxy
    }
}

export function contains( min: number, max: number, x: number ) {
    return x >= min && x <= max
}

export function contains2D( pos: Vector, width: number, height: number, pt: Vector ) {
    return contains( pos.x, pos.x + width, pt.x ) && contains( pos.y, pos.y + height, pt.y )
}

export function clamp( min: number, max: number, x: number ) {
    return ( x < min ) ? min : ( ( x > max ) ? max : x )
}

export function lerp( start: number, end: number, alpha: number ) {
    return ( end - start ) * alpha + start
}

export function modulus( quotient: number, divisor: number ) {
    return ( ( quotient % divisor ) + divisor ) % divisor
}
