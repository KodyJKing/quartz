import AABB from "../math/AABB"
import { clamp, contains, remap } from "../math/math"
import Vector from "../math/Vector"

// If calculating bounds is slow, it should be cached on the provider because it is called 2-3 times per body here.
export interface IBroadphaseEntry { getBounds: () => AABB, id: number }
export default class Broadphase {
    static findPairs<T extends IBroadphaseEntry>( bodies: T[], cellSize: number, callback: ( a: T, b: T ) => void ) {
        let bounds = AABB.empty()
        for ( let body of bodies )
            bounds.addAABB( body.getBounds() )

        let width = bounds.width()
        let height = bounds.height()
        let gridWidth = Math.ceil( width / cellSize )
        let gridHeight = Math.ceil( height / cellSize )

        const x_to_i = ( x: number ) => clamp( 0, gridWidth - 1, Math.floor( remap( bounds.minx, bounds.maxx, 0, gridWidth - 1, x ) ) )
        const y_to_j = ( y: number ) => clamp( 0, gridHeight - 1, Math.floor( remap( bounds.miny, bounds.maxy, 0, gridHeight - 1, y ) ) )

        type GridCell = T[]
        const grid = new Map<number, GridCell>()
        // const grid: GridCell[] = []
        // for ( let i = 0; i < gridWidth * gridHeight; i++ )
        //     grid.push( [] )

        // Place bodies in grid.
        for ( let body of bodies ) {
            let bounds = body.getBounds()
            let i1 = x_to_i( bounds.minx )
            let i2 = x_to_i( bounds.maxx )
            let j1 = y_to_j( bounds.miny )
            let j2 = y_to_j( bounds.maxy )
            for ( let i = i1; i <= i2; i++ ) {
                for ( let j = j1; j <= j2; j++ ) {
                    let cellIndex = i * gridHeight + j
                    if ( !grid.has( cellIndex ) )
                        grid.set( cellIndex, [] )
                    grid.get( cellIndex )?.push( body )
                }
            }
        }


        let visitedPairs = new Set<number>()

        for ( let gridCell of grid.values() ) {
            for ( let iBodyA = 0; iBodyA < gridCell.length; iBodyA++ ) {
                let bodyA = gridCell[ iBodyA ]
                let boundsA = bodyA.getBounds()
                for ( let iBodyB = iBodyA + 1; iBodyB < gridCell.length; iBodyB++ ) {
                    let bodyB = gridCell[ iBodyB ]

                    let boundsB = bodyB.getBounds()
                    if ( !boundsA.overlaps( boundsB ) )
                        continue

                    // Check if pair has been visited.
                    let minId = Math.min( bodyA.id, bodyB.id )
                    let maxId = Math.max( bodyA.id, bodyB.id )
                    let pairKey = ( maxId << 16 ) | minId
                    if ( visitedPairs.has( pairKey ) ) continue
                    visitedPairs.add( pairKey )

                    callback( bodyA, bodyB )
                }
            }
        }

        // // Iterate over grid to generate pairs.
        // for ( let i = 0; i < gridWidth; i++ ) {
        //     for ( let j = 0; j < gridHeight; j++ ) {
        //         let cellIndex = i * gridHeight + j
        //         let gridCell = grid[ cellIndex ]
        //         for ( let iBodyA = 0; iBodyA < gridCell.length; iBodyA++ ) {
        //             let bodyA = gridCell[ iBodyA ]
        //             let boundsA = bodyA.getBounds()
        //             for ( let iBodyB = iBodyA + 1; iBodyB < gridCell.length; iBodyB++ ) {
        //                 let bodyB = gridCell[ iBodyB ]

        //                 let boundsB = bodyB.getBounds()
        //                 if ( !boundsA.overlaps( boundsB ) )
        //                     continue

        //                 // Check if pair has been visited.
        //                 let minId = Math.min( bodyA.id, bodyB.id )
        //                 let maxId = Math.max( bodyA.id, bodyB.id )
        //                 let pairKey = ( maxId << 16 ) | minId
        //                 if ( visitedPairs.has( pairKey ) ) continue
        //                 visitedPairs.add( pairKey )

        //                 callback( bodyA, bodyB )
        //             }
        //         }
        //     }
        // }
    }
}