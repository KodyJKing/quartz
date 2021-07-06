import { modulus } from "../math/math"
import Vector from "../math/Vector"

export default class Drawing {
    static context: CanvasRenderingContext2D
    static stroke( color?: string ) {
        if ( color )
            Drawing.context.strokeStyle = color
        Drawing.context.stroke()
        return Drawing
    }
    static fill( color?: string ) {
        if ( color )
            Drawing.context.fillStyle = color
        Drawing.context.fill()
        return Drawing
    }
    static vLine( a: Vector, b: Vector ) {
        let c = Drawing.context
        c.beginPath()
        c.moveTo( a.x, a.y )
        c.lineTo( b.x, b.y )
        return Drawing
    }
    static line( ax, ay, bx, by ) {
        let c = Drawing.context
        c.beginPath()
        c.moveTo( ax, ay )
        c.lineTo( bx, by )
        return Drawing
    }
    static vCircle( position: Vector, radius: number ) {
        Drawing.context.beginPath()
        Drawing.context.arc( position.x, position.y, radius, 0, Math.PI * 2 )
        return Drawing
    }
    static circle( x, y, radius: number ) {
        Drawing.context.beginPath()
        Drawing.context.arc( x, y, radius, 0, Math.PI * 2 )
        return Drawing
    }
    static vRect( position: Vector, width, height ) {
        Drawing.context.rect( position.x, position.y, width, height )
        return Drawing
    }
    static rect( x, y, width, height ) {
        Drawing.context.rect( x, y, width, height )
        return Drawing
    }
    static polygon( poly: Vector[], padding = 0 ) {
        let c = Drawing.context
        if ( poly.length == 0 )
            return Drawing
        const getPoint = i => {
            if ( padding == 0 )
                return poly[ i ]
            let p0 = poly[ modulus( i - 1, poly.length ) ]
            let p1 = poly[ i ]
            let p2 = poly[ ( i + 1 ) % poly.length ]
            let tangent1 = p1.subtract( p0 ).unit()
            let tangent2 = p2.subtract( p1 ).unit()
            let midNormal = tangent1.lerp( tangent2, .5 ).rightNormal().unit()
            return p1.add( midNormal.scale( padding ) )
        }
        let pt = getPoint( 0 )
        c.beginPath()
        c.moveTo( pt.x, pt.y )
        for ( let i = 1; i < poly.length; i++ ) {
            pt = getPoint( i )
            c.lineTo( pt.x, pt.y )
        }
        c.closePath()
        return Drawing
    }
}