import Geometry from "./Geometry"
import Vector from "./Vector"

export default class Edge {
    a: Vector
    b: Vector
    constructor( a: Vector, b: Vector ) {
        this.a = a
        this.b = b
    }
    heightAbove( point: Vector ) {
        return point.subtract( this.a ).cross( this.b.subtract( this.a ) )
    }
    clipTo( other: Edge ) {
        let clippingNormal = other.b.subtract( other.a )
        let distA = other.a.dot( clippingNormal )
        let distB = other.b.dot( clippingNormal )

        let thisTangent = this.b.subtract( this.a )
        let thisNormal = thisTangent.rightNormal()
        let thisDist = this.a.dot( thisNormal )

        function clipPoint( p: Vector ) {
            let dist = p.dot( clippingNormal )
            if ( dist < distA )
                return Geometry.intersect( thisNormal, thisDist, clippingNormal, distA )
            if ( dist > distB )
                return Geometry.intersect( thisNormal, thisDist, clippingNormal, distB )
            return p
        }

        this.a = clipPoint( this.a ) ?? this.a
        this.b = clipPoint( this.b ) ?? this.b
    }
    normal() {
        return this.b.subtract( this.a ).rightNormal()
    }
    intersect( other: Edge ) {
        let thisNormal = this.normal()
        let otherNormal = other.normal()
        let thisDist = this.a.dot( thisNormal )
        let otherDist = other.a.dot( otherNormal )
        return Geometry.intersect( thisNormal, thisDist, otherNormal, otherDist )
    }
}