import Geometry from "../math/Geometry"
import Vector from "../math/Vector"
import SupportFunction from "./SupportFunction"

export type RaycastInfo = { time: number, normal: Vector }
export default function shapecast( supportA: SupportFunction, velocityA: Vector, supportB: SupportFunction, velocityB: Vector ) {
    // Minkowski difference: A - B
    let minkowskiDiff = ( axis: Vector ) => supportA( axis ).subtract( supportB( axis.negate() ) )
    let relativeVelocity = velocityB.subtract( velocityA )
    return raycastSupportFunction( minkowskiDiff, relativeVelocity )
}

function raycastSupportFunction( support: SupportFunction, ray: Vector, maxIterations = 10 ): RaycastInfo | undefined {
    let a = support( ray.rightNormal() )
    let b = support( ray.leftNormal() )

    if ( a.dot( ray.rightNormal() ) < 0 )
        return undefined

    if ( b.dot( ray.leftNormal() ) < 0 )
        return undefined

    let i = 0
    while ( true ) {
        let ab = b.subtract( a )
        let ao = a.negate()
        let abNormal = ab.normalOnSide( ao )
        let c = support( abNormal )

        if ( ( ++i == maxIterations ) || c.equivalent( a ) || c.equivalent( b ) ) {
            let normal = abNormal.unit()
            let edgeDist = normal.dot( a )
            let approachSpeed = - normal.dot( ray )
            let time = edgeDist / approachSpeed
            // let hitPoint = Geometry.intersect( ray.rightNormal(), 0, abNormal, a.dot( abNormal ) )
            // if ( !hitPoint ) return null // This should never happen.
            // let time = hitPoint.dot( ray )
            return { time, normal }
        }

        if ( c.dot( ray.rightNormal() ) > 0 )
            a = c
        else
            b = c
    }
}