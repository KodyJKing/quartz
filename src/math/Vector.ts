import { equals } from "./math"

export class Vector {
    x: number
    y: number
    static zero = new Vector( 0, 0 )
    static one = new Vector( 1, 1 )
    static right = new Vector( 1, 0 )
    static down = new Vector( 0, 1 )
    constructor( x, y ) {
        this.x = x
        this.y = y
    }
    get length() { return Math.sqrt( this.x ** 2 + this.y ** 2 ) }
    get lengthSquared() { return this.x * this.x + this.y * this.y }
    get angle() { return Math.atan2( this.y, this.x ) }

    unit() { return this.scale( 1 / this.length ) }
    leftNormal() { return new Vector( -this.y, this.x ) }
    rightNormal() { return new Vector( this.y, -this.x ) }
    negate() { return new Vector( -this.x, -this.y ) }
    half() { return new Vector( this.x * 0.5, this.y * 0.5 ) }
    copy() { return new Vector( this.x, this.y ) }

    floor( scale = 1 ) { return new Vector( Math.floor( this.x / scale ) * scale, Math.floor( this.y / scale ) * scale ) }

    add( other: Vector ) { return new Vector( this.x + other.x, this.y + other.y ) }
    addXY( x: number, y: number ) { return new Vector( this.x + x, this.y + y ) }
    addX( x: number ) { return new Vector( this.x + x, this.y ) }
    addY( y: number ) { return new Vector( this.x, this.y + y ) }
    subtract( other: Vector ) { return new Vector( this.x - other.x, this.y - other.y ) }
    dot( other: Vector ) { return this.x * other.x + this.y * other.y }
    cross( other: Vector ) { return this.x * other.y - this.y * other.x }
    scale( scale: number ) { return new Vector( this.x * scale, this.y * scale ) }
    stretch( x: number, y: number ) { return new Vector( this.x * x, this.y * y ) }
    divide( divisor: number ) { return new Vector( this.x / divisor, this.y / divisor ) }
    lerp( other: Vector, t: number ) { return this.scale( 1 - t ).add( other.scale( t ) ) }

    distance( other: Vector ) { return Math.sqrt( ( this.x - other.x ) ** 2 + ( this.y - other.y ) ** 2 ) }

    rotated( angle: number ) {
        return this.complexProduct( Vector.polar( angle, 1 ) )
    }

    isRightOf( other: Vector ) {
        return this.cross( other ) > 0
    }

    normalOnSide( side: Vector ) {
        if ( side.isRightOf( this ) )
            return this.rightNormal()
        return this.leftNormal()
    }

    complexProduct( other: Vector ) {
        let x = this.x * other.x - this.y * other.y
        let y = this.x * other.y + this.y * other.x
        return new Vector( x, y )
    }

    complexQuotient( other: Vector ) {
        let lengthSquared = other.lengthSquared
        let x = this.x * other.x + this.y * other.y
        let y = this.y * other.x - this.x * other.y
        return new Vector( x / lengthSquared, y / lengthSquared )
    }

    complexExponential() {
        let magnitude = Math.exp( this.x )
        return new Vector( magnitude * Math.cos( this.y ), magnitude * Math.sin( this.y ) )
    }

    projection( other: Vector ) {
        return other.scale( other.dot( this ) / other.lengthSquared )
    }

    static polar( angle, length ) {
        return new Vector( Math.cos( angle ) * length, Math.sin( angle ) * length )
    }
}