import { Vector } from "./Vector"

const epsilon = 0.000001

export default class Matrix {
    readonly m11 = 0; readonly m12 = 0; readonly m13 = 0
    readonly m21 = 0; readonly m22 = 0; readonly m23 = 0
    readonly m31 = 0; readonly m32 = 0; readonly m33 = 0

    static identity = new Matrix(
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    )

    constructor(
        m11, m12, m13,
        m21, m22, m23,
        m31, m32, m33
    ) {
        this.m11 = m11; this.m12 = m12; this.m13 = m13
        this.m21 = m21; this.m22 = m22; this.m23 = m23
        this.m31 = m31; this.m32 = m32; this.m33 = m33
    }

    multiply( other: Matrix ): Matrix { return multiplyMatrix( this, other, Matrix ) }
    inverse(): Matrix { return inverse( this, Matrix ) }
    determinant(): number { return determinant( this, Matrix ) }
    equals( other: Matrix ): boolean { return equals( this, other, epsilon, Matrix ) }

    multiplyVec( v: Vector, z: number = 1 ) {
        let {
            m11, m12, m13,
            m21, m22, m23,
        } = this
        let { x, y } = v
        return new Vector(
            m11 * x + m12 * y + m13 * z,
            m21 * x + m22 * y + m23 * z,
        )
    }

    static translation( x = 0, y = 0 ) {
        return new Matrix(
            1, 0, x,
            0, 1, y,
            0, 0, 1
        )
    }

    static vTranslation( v: Vector ) {
        return new Matrix(
            1, 0, v.x,
            0, 1, v.y,
            0, 0, 1
        )
    }

    static rotation( angle = 0 ) {
        let s = Math.sin( angle )
        let c = Math.cos( angle )
        return new Matrix(
            c, -s, 0,
            s, c, 0,
            0, 0, 1
        )
    }

    static scale( x = 1, y = 1 ) {
        return new Matrix(
            x, 0, 0,
            0, y, 0,
            0, 0, 1
        )
    }

    // https://en.wikipedia.org/wiki/Transformation_matrix#Affine_transformations
    static transformation( preTranslationX, preTranslationY, angle, scaleX, scaleY, translationX, translationY ) {
        let px = preTranslationX, py = preTranslationY
        let a = angle
        let sx = scaleX
        let sy = scaleY
        let x = translationX
        let y = translationY
        let s = Math.sin( a ), c = Math.cos( a )
        return new Matrix(
            sx * c, -sy * s, px * sx * c - py * sy * s + x,
            sx * s, sy * c, px * sx * s + py * sy * c + y,
            0, 0, 1
        )
    }

    static scaleAndTranslate( scale, translationX, translationY ) {
        let s = scale
        let x = translationX
        let y = translationY
        return new Matrix(
            s, 0, x,
            0, s, y,
            0, 0, 1
        )
    }

    print() {
        let {
            m11, m12, m13,
            m21, m22, m23,
            m31, m32, m33,
        } = this
        let rows = [
            [ m11, m12, m13 ],
            [ m21, m22, m23 ],
            [ m31, m32, m33 ],
        ]
        let columnWidths = [
            [ m11, m21, m31 ],
            [ m12, m22, m32 ],
            [ m13, m23, m33 ],
        ].map(
            column =>
                column.map(
                    e => e.toString().length
                ).reduce(
                    ( a, b ) => Math.max( a, b )
                )
        )
        let pad = ( n: number, column: number ) => n.toString().padStart( columnWidths[ column ] )
        let result = rows.map(
            row => "| " + row.map( pad ).join( "  " ) + " |"
        ).join( "\n" )
        console.log( result )
    }

}

// Code generation:

// function* rangeGen( n ) { for ( let i = 1; i <= n; i++ ) yield i }
// function range( n ) { return Array.from( rangeGen( n ) ) }
function range( n ) {
    let res = [] as number[]
    for ( let i = 1; i <= n; i++ ) res.push( i )
    return res
}

function determinant2(
    a11, a12,
    a21, a22
) {
    return "( " + a11 + " * " + a22 + " - " + a12 + " * " + a21 + " )"
}

function determinant3( args: string[] ) {
    let [
        a11, a12, a13,
        a21, a22, a23,
        a31, a32, a33
    ] = args
    return `(${ a11 } * ${ determinant2( a22, a23, a32, a33 ) } -
    ${ a12 } * ${ determinant2( a21, a23, a31, a33 ) } +
    ${ a13 } * ${ determinant2( a21, a22, a31, a32 ) })`
}

function destructureMatrix( name: string ) {
    let destructureArgs = range( 3 ).map(
        j => range( 3 ).map(
            i => "m" + j + i + ": " + name + j + i
        ).join( ", " )
    ).join( ",\n    " )
    return "let {\n    " + destructureArgs + "\n} = " + name
}

const determinant = ( () => {
    let args = range( 3 ).map( ( j ) => range( 3 ).map( ( i ) => "A.m" + j + i ) ).flat()
    let body = "return " + determinant3( args )
    return new Function( "A", "Matrix3", body )
} )()

const multiplyMatrix = ( () => {
    let destructureA = destructureMatrix( "A" )
    let destructureB = destructureMatrix( "B" )
    let matrixArgs = range( 3 ).map(
        j => range( 3 ).map(
            i => range( 3 ).map(
                k => "A" + j + k + " * B" + k + i
            ).join( " + " )
        ).join( ", " )
    ).join( ",\n    " )
    let body = [
        destructureA,
        destructureB,
        `return new Matrix3(\n    ${ matrixArgs }\n)`
    ].join( "\n" )
    return new Function( "A", "B", "Matrix3", body )
} )()

// https://en.wikipedia.org/wiki/Cramer%27s_rule#Finding_inverse_matrix
// https://en.wikipedia.org/wiki/Adjugate_matrix#3_%C3%97_3_generic_matrix
const inverse = ( () => {
    let destructure = destructureMatrix( "A" )

    let detArgs = range( 3 ).map( ( j ) => range( 3 ).map( ( i ) => "A" + j + i ) ).flat()
    let coefStatemnent = "let c = 1 / " + determinant3( detArgs )

    let det2 = ( a, b, c, d ) => determinant2( "A" + a, "A" + b, "A" + c, "A" + d )
    // Adjugate matrix:
    let b11 = det2( 22, 23, 32, 33 ), b12 = "-" + det2( 12, 13, 32, 33 ), b13 = det2( 12, 13, 22, 23 )
    let b21 = "-" + det2( 21, 23, 31, 33 ), b22 = det2( 11, 13, 31, 33 ), b23 = "-" + det2( 11, 13, 21, 23 )
    let b31 = det2( 21, 22, 31, 32 ), b32 = "-" + det2( 11, 12, 31, 32 ), b33 = det2( 11, 12, 21, 22 )

    let matrixArgs = [
        [ b11, b12, b13 ],
        [ b21, b22, b23 ],
        [ b31, b32, b33 ]
    ].map( row => row.map( e => e + " * c" ).join( ", " ) ).join( ",\n    " )

    let body = [
        destructure,
        coefStatemnent,
        `\nreturn new Matrix3(${ matrixArgs })`
    ].join( "\n" )
    return new Function( "A", "Matrix3", body )
} )()

const equals = ( () => {
    let destructureA = destructureMatrix( "A" )
    let destructureB = destructureMatrix( "B" )
    let comparisons = range( 3 ).map(
        j => range( 3 ).map(
            i => {
                let index = j.toString() + i.toString()
                return `if (Math.abs(A${ index } - B${ index }) > epsilon) return false`
            }
        )
    ).flat()
    let body = [
        destructureA,
        destructureB,
        ...comparisons,
        "return true"
    ].join( "\n" )
    return new Function( "A", "B", "epsilon", "Matrix3", body )
} )()