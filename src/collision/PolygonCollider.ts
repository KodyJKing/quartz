import Body from "../dynamics/Body"
import AABB from "../math/AABB"
import Matrix from "../math/Matrix"
import Vector from "../math/Vector"
import ICollider from "./ICollider"

export default class PolygonCollider implements ICollider {
    body!: Body
    model: Vector[]
    vertices: Vector[]
    bounds: AABB
    constructor( model: Vector[] ) {
        this.model = model
        this.vertices = []
        for ( let i = 0; i < model.length; i++ )
            this.vertices.push( model[ i ].copy() )
        this.bounds = new AABB( 0, 0, 0, 0 )
    }
    support( axis: Vector ): Vector {
        let verts = this.vertices
        let best = verts[ 0 ]
        let bestDist = best.dot( axis )
        for ( let i = 1; i < verts.length; i++ ) {
            let next = verts[ i ]
            let nextDist = next.dot( axis )
            if ( nextDist > bestDist )
                best = next, bestDist = nextDist
        }
        return best
    }
    onUpdatePosition(): void {
        let { x, y } = this.body.position
        let angle = this.body.angle
        let mat = Matrix.transformation( 0, 0, angle, 1, 1, x, y )
        for ( let i = 0; i < this.model.length; i++ )
            mat.multiplyVec( this.model[ i ], 1, this.vertices[ i ] )
        this.bounds = AABB.polygonBounds( this.vertices )
    }
}