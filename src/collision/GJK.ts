
// import Vector from "../Vector"
// import SupportFunction from "./SupportFunction"


// export default function GJK( support: SupportFunction, simplices?: Vector[][], maxIterations = 100, initialHeading = Vector2.RIGHT ) {
//     let initialPoint = support( initialHeading )
//     let heading = initialPoint.scale(-1)
//     let simplex: Vector[] = [ initialPoint ]

//     function checkAndUpdateSimplex() {
//         if ( simplices )
//             simplices.push( simplex.slice() )

//         switch ( simplex.length ) {

//             case 1: {
//                 heading = simplex[ 0 ].scale( -1 )
//                 return false
//             }

//             case 2: {
//                 let [ b, a ] = simplex
//                 let ab = b.subtract( a )
//                 let ao = a.scale( -1 )
//                 if ( ab.dot( ao ) < 0 ) {
//                     heading = ao
//                     simplex = [ a ]
//                     return false
//                 }

//                 heading = ab.normalOnSide( ao )
//                 return false
//             }

//             case 3: {
//                 let [ c, b, a ] = simplex
//                 let ab = b.subtract( a )
//                 let ac = c.subtract( a )
//                 let ao = a.negate()

//                 let inAB = ab.dot( ao ) > 0
//                 let inAC = ac.dot( ao ) > 0

//                 if ( !inAB && !inAC ) {
//                     heading = ao
//                     simplex = [ a ]
//                     return false
//                 }

//                 let abNormal = ab.normalOnSide( ac ).negate()
//                 let acNormal = ac.normalOnSide( ab ).negate()

//                 let belowAB = abNormal.dot( ao ) < 0
//                 let belowAC = acNormal.dot( ao ) < 0

//                 if ( belowAB && belowAC )
//                     return true

//                 if ( inAB && !belowAB ) {
//                     heading = abNormal
//                     simplex = [ b, a ]
//                     return false
//                 }

//                 heading = acNormal
//                 simplex = [ c, a ]
//                 return false
//             }
//         }
//     }

//     let i = 0
//     while ( true ) {
//         if ( ++i > maxIterations )
//             return false
//         let nextVertex = support( heading )
//         if ( nextVertex.dot( heading ) < 0 )
//             return false
//         simplex.push( nextVertex )
//         let intersected = checkAndUpdateSimplex()
//         if ( intersected )
//             return true
//     }

// }